import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { agriConnectAPI } from '../../services/api';
import {
  FiChevronDown,
  FiChevronUp,
  FiDownload,
  FiShare2,
  FiPrinter,
  FiMapPin,
  FiCalendar,
  FiDroplet,
  FiSun,
  FiThermometer
} from 'react-icons/fi';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

function AgroClimate() {
  // regions: new shape { error: boolean, data: [] }
  const [regions, setRegions] = useState({ error: false, data: [] });
  const [selectedRegion, setSelectedRegion] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [cropRecommendations, setCropRecommendations] = useState([]);
  const [loading, setLoading] = useState(true); // overall loading for initial data
  const [error, setError] = useState(null); // business errors (recommendations, weather fetch fallbacks handled)
  const [selectedSeason, setSelectedSeason] = useState('');
  const [expandedSections, setExpandedSections] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [showPrintOptions, setShowPrintOptions] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [weatherLoading, setWeatherLoading] = useState(false);

  const seasons = ['rainy', 'dry', 'spring', 'summer', 'autumn', 'winter'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
                 'July', 'August', 'September', 'October', 'November', 'December'];

  // Fetch regions on mount
  useEffect(() => {
    fetchRegions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Whenever selectedRegion or season changes, fetch dependent data
  useEffect(() => {
    if (selectedRegion) {
      fetchWeatherData();
      fetchCropRecommendations();
    } else {
      // if no region selected, clear region-specific data
      setWeatherData(null);
      setCropRecommendations([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRegion, selectedSeason]);

  // Build chart data when crop recommendations change
  useEffect(() => {
    if (cropRecommendations.length > 0) {
      const countBySeason = cropRecommendations.reduce((acc, rec) => {
        const s = rec.season || 'unspecified';
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      }, {});
      setChartData(Object.entries(countBySeason).map(([season, count]) => ({
        season,
        recommendations: count,
      })));
    } else {
      setChartData([]);
    }
  }, [cropRecommendations]);

  // Fetch regions implementation sets the state shape: { error, data }
  const fetchRegions = async () => {
    try {
      setLoading(true);
      setRegions(prev => ({ ...prev, error: false })); // reset error
      const data = await agriConnectAPI.agroclimate.getRegions();
      // The API might return { regions: [...] } or an array directly.
      const regionList = data?.regions ?? data ?? [];
      setRegions({ error: false, data: regionList });

      if (regionList && regionList.length > 0) {
        // Preserve previously selected region if it still exists; else pick first
        const prevSelected = regionList.find(r => r.id === selectedRegion);
        if (!prevSelected) {
          setSelectedRegion(regionList[0].id);
        }
      } else {
        // no regions found - clear selection
        setSelectedRegion('');
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching regions:', err);
      setRegions({ error: true, data: [] });
      setLoading(false);
    }
  };

  const fetchWeatherData = async () => {
    try {
      setWeatherLoading(true);
      const region = regions.data.find(r => r.id === (typeof selectedRegion === 'string' ? parseInt(selectedRegion) : selectedRegion));
      if (!region) {
        // no region available
        setWeatherData(null);
        setWeatherLoading(false);
        return;
      }

      // Call backend weather API
      const weatherResponse = await agriConnectAPI.agroclimate.getWeather(region.id);
      
      if (weatherResponse) {
        setWeatherData({
          temperature: Math.round(weatherResponse.temperature || 0),
          feels_like: Math.round(weatherResponse.temperature || 0), // Backend doesn't provide feels_like
          humidity: weatherResponse.humidity || 0,
          rainfall: weatherResponse.rainfall || 0,
          wind_speed: Math.round((weatherResponse.wind_speed || 0) * 3.6), // Convert m/s to km/h if needed
          wind_direction: weatherResponse.wind_direction || 0,
          weather_condition: weatherResponse.weather_condition || 'Unknown',
          description: weatherResponse.weather_condition || 'No description available',
          pressure: 1013, // Not provided by backend, using default
          visibility: 10, // Not provided by backend, using default
          sunrise: new Date().toLocaleTimeString(), // Default values since backend doesn't provide
          sunset: new Date().toLocaleTimeString(),
          last_updated: new Date().toLocaleString(),
          source: 'Tomorrow.io API'
        });
        setError(null);
      } else {
        throw new Error('No weather data received from backend');
      }
    } catch (err) {
      console.error('Weather API failed:', err);
      setError('Failed to load weather data. Please check your connection and try again.');
    } finally {
      setWeatherLoading(false);
    }
  };

  const fetchCropRecommendations = async () => {
    try {
      setLoading(true);
      const data = await agriConnectAPI.agroclimate.getCropRecommendations(
        selectedRegion,
        selectedSeason || null
      );
      const recs = data?.recommendations ?? data ?? [];
      setCropRecommendations(recs);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError('Failed to fetch crop recommendations');
      setCropRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const getWeatherIcon = (condition) => {
    const conditionLower = condition?.toLowerCase();
    if (conditionLower?.includes('sunny') || conditionLower?.includes('clear')) return '☀️';
    if (conditionLower?.includes('cloud')) return '☁️';
    if (conditionLower?.includes('rain')) return '🌧️';
    if (conditionLower?.includes('storm') || conditionLower?.includes('thunder')) return '⛈️';
    if (conditionLower?.includes('snow')) return '❄️';
    if (conditionLower?.includes('fog') || conditionLower?.includes('mist')) return '🌫️';
    return '🌤️';
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handlePrint = () => {
    const content = document.getElementById('printable-content');
    if (content) {
      window.print();
    } else {
      alert("Printing recommendations...");
    }
  };

  const handleShare = () => {
    const name = regions.data.find(r => r.id === (typeof selectedRegion === 'string' ? parseInt(selectedRegion) : selectedRegion))?.name ?? 'your region';
    if (navigator.share) {
      navigator.share({
        title: `AgroClimate Advice for ${name}`,
        text: 'Check out these farming recommendations for my region!',
        url: window.location.href
      });
    } else {
      alert("Sharing recommendations...");
    }
  };

  // If there was an error fetching regions, show a focused retry UI (per your snippet)
  if (regions.error) {
    return (
      <div className="p-4 sm:p-8 max-w-7xl mx-auto text-center">
        <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No Regions Available</h2>
          <p className="text-gray-600 mb-4">We're having trouble loading the regions data. Please try refreshing the page.</p>
          <button
            onClick={fetchRegions}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
          >
            Retry Loading Regions
          </button>
        </div>
      </div>
    );
  }

  // selectedRegionData - may be undefined when regions.data is empty
  const selectedRegionData = regions.data.find(r => r.id === (typeof selectedRegion === 'string' ? parseInt(selectedRegion) : selectedRegion));

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto text-gray-800 space-y-8">
      {/* Header */}
      <header className="text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-green-800 mb-3">
          <FiMapPin className="inline mr-2" />
          Agro-Climate Advisory System
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Personalized farming recommendations tailored to your specific region's climate conditions.
          Get real-time weather updates, crop suggestions, planting calendars, and best practices for optimal yields.
        </p>
      </header>

      {/* Region & Season Selector */}
      <section className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-2xl font-semibold mb-4 flex items-center">
          <FiMapPin className="mr-2 text-green-600" />
          Select Your Farming Region
        </h2>

        {/* Loading indicator for regions when data empty */}
        {loading && regions.data.length === 0 ? (
          <div className="flex items-center gap-3 mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
            <span className="text-gray-600">Loading regions...</span>
          </div>
        ) : null}

        {/* If there are no regions but not an error, show a small notice + retry */}
        {(!loading && regions.data.length === 0) && (
          <div className="mb-4 p-4 rounded border border-dashed border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-600 mb-2">No regions available yet. You can retry loading or continue to other features.</p>
            <button
              onClick={fetchRegions}
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
            >
              Retry Loading Regions
            </button>
          </div>
        )}

        <div className="flex flex-wrap gap-3 mb-6">
          {regions.data.map((region) => (
            <button
              key={region.id}
              onClick={() => setSelectedRegion(region.id)}
              className={`px-5 py-2 rounded-full text-sm font-medium shadow-sm transition-all duration-200
                ${selectedRegion === region.id
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-50 text-gray-700 hover:bg-green-50 hover:text-green-700 border border-gray-200'}`}
            >
              {region.name}
            </button>
          ))}
        </div>

        {/* Season & Month Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Season
            </label>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
            >
              <option value="">All Seasons</option>
              {seasons.map(season => (
                <option key={season} value={season}>
                  {season.charAt(0).toUpperCase() + season.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <FiCalendar className="mr-2" />
              Select Month for Activities:
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
            >
              {months.map((month, index) => (
                <option key={month} value={index}>{month}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchWeatherData}
              disabled={weatherLoading || !selectedRegion}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center"
            >
              {weatherLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Refreshing Weather
                </>
              ) : (
                <>
                  <FiSun className="mr-2" />
                  {selectedRegion ? 'Refresh Weather' : 'Select a Region to Fetch Weather'}
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
          {error}
        </div>
      )}

      {/* If a region is selected, show its overview; if not selected, show a gentle prompt */}
      {selectedRegion && selectedRegionData ? (
        <>
          {/* Region Overview */}
          <section className="bg-white rounded-xl shadow-sm p-6 border border-gray-100" id="printable-content">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-green-700 mb-1">
                  {selectedRegionData.name}
                </h2>
                <p className="text-gray-600">{selectedRegionData.description || 'Region in Kenya with specific agro-climate conditions.'}</p>
              </div>
              <div className="flex space-x-2 relative">
                <button
                  onClick={() => setShowPrintOptions(!showPrintOptions)}
                  className="p-2 rounded-full hover:bg-gray-100"
                  title="Export options"
                >
                  <FiDownload className="text-gray-600" />
                </button>
                {showPrintOptions && (
                  <div className="absolute right-0 mt-8 bg-white shadow-lg rounded-md p-2 border border-gray-200 z-10">
                    <button
                      onClick={handlePrint}
                      className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <FiPrinter className="mr-2" /> Print/Save as PDF
                    </button>
                    <button
                      onClick={handleShare}
                      className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <FiShare2 className="mr-2" /> Share Recommendations
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Real-time Weather Dashboard */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <FiSun className="mr-2 text-yellow-500" />
                Current Weather Conditions
              </h3>

              {weatherLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
                  <span className="ml-3 text-gray-600">Fetching real-time weather...</span>
                </div>
              ) : weatherData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg flex items-center">
                    <span className="text-3xl mr-3">{getWeatherIcon(weatherData.weather_condition)}</span>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Condition</h4>
                      <p className="text-lg font-semibold capitalize">{weatherData.description}</p>
                    </div>
                  </div>

                  <div className="bg-orange-50 p-4 rounded-lg flex items-center">
                    <FiThermometer className="text-orange-500 text-2xl mr-3" />
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Temperature</h4>
                      <p className="text-lg font-semibold">{weatherData.temperature}°C</p>
                      {weatherData.feels_like && (
                        <p className="text-xs text-gray-500">Feels like {weatherData.feels_like}°C</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg flex items-center">
                    <FiDroplet className="text-green-500 text-2xl mr-3" />
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Humidity</h4>
                      <p className="text-lg font-semibold">{weatherData.humidity}%</p>
                    </div>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg flex items-center">
                    <div className="text-purple-500 mr-3">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Rainfall</h4>
                      <p className="text-lg font-semibold">{(weatherData.rainfall ?? 0).toFixed(1)}mm</p>
                    </div>
                  </div>

                  <div className="md:col-span-2 lg:col-span-1 bg-yellow-50 p-4 rounded-lg">
                    <FiSun className="text-yellow-500 text-2xl mr-3 inline" />
                    <span className="text-sm font-medium text-gray-500 mr-2">Sunrise/Sunset:</span>
                    <span className="text-sm">{weatherData.sunrise} / {weatherData.sunset}</span>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-gray-500 mr-3">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Wind</h4>
                      <p className="text-lg font-semibold">{weatherData.wind_speed} km/h</p>
                      {weatherData.wind_direction && <p className="text-xs">{weatherData.wind_direction}°</p>}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
                  <p>Weather data not available</p>
                  <button
                    onClick={fetchWeatherData}
                    className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Refresh Weather
                  </button>
                </div>
              )}

              {weatherData && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                  <p><strong>Last Updated:</strong> {weatherData.last_updated}</p>
                  <p className="text-xs">
                    Weather data powered by Tomorrow.io API
                  </p>
                </div>
              )}
            </div>

            {/* Recommendations Chart */}
            {cropRecommendations.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4">Recommendations Overview</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="season" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="recommendations" fill="#4CAF50" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Expandable Recommendation Sections */}
            <div className="space-y-4">
              <RecommendationSection
                title="🌱 Recommended Crops & Varieties"
                items={cropRecommendations}
                isExpanded={expandedSections.crops}
                toggle={() => toggleSection('crops')}
                type="crops"
              />

              <RecommendationSection
                title="📅 Planting & Harvesting Schedule"
                items={cropRecommendations.map(rec => ({
                  planting: rec.planting_month,
                  harvesting: rec.harvesting_month,
                  crop: rec.crop_name,
                  yield: rec.expected_yield
                }))}
                isExpanded={expandedSections.schedule}
                toggle={() => toggleSection('schedule')}
                type="schedule"
              />
            </div>

            {/* Monthly Activity Calendar */}
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <FiCalendar className="mr-2 text-green-600" />
                {months[selectedMonth]} Activities for {selectedRegionData.name}
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Seasonal Focus</h4>
                    <p className="text-gray-700">
                      {selectedMonth >= 2 && selectedMonth <= 4 ?
                        "🌧️ Long Rains Season - Prime planting time for most crops" :
                        selectedMonth >= 9 && selectedMonth <= 11 ?
                          "☀️ Short Rains Season - Late planting and early harvesting" :
                          selectedMonth >= 0 && selectedMonth <= 1 ?
                            "🌾 Harvesting & Preparation - Post-harvest handling and land prep" :
                            "🌱 Maintenance Season - Weeding, fertilizing, and crop care"}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Weather Impact</h4>
                    <p className="text-gray-700">
                      {weatherData ?
                        `Current conditions (${(weatherData.weather_condition || '').toLowerCase()}) suggest ${weatherData.temperature}°C temperatures with ${weatherData.humidity}% humidity.` :
                        "Monitor local weather for optimal planting decisions."}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-gray-700">Key Activities This Month:</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    {selectedMonth >= 2 && selectedMonth <= 4 ? (
                      <>
                        <li>Prepare land and plant recommended crops</li>
                        <li>Apply basal fertilizers during planting</li>
                        <li>Monitor for early pest and disease outbreaks</li>
                        <li>Set up irrigation systems if needed</li>
                      </>
                    ) : selectedMonth >= 9 && selectedMonth <= 11 ? (
                      <>
                        <li>Plant short-season varieties</li>
                        <li>Apply top-dressing fertilizers</li>
                        <li>Control weeds during crop establishment</li>
                        <li>Prepare for potential dry spells</li>
                      </>
                    ) : (
                      <>
                        <li>Harvest mature crops and prepare storage</li>
                        <li>Test soil for nutrient deficiencies</li>
                        <li>Plan crop rotation for next season</li>
                        <li>Maintain farm infrastructure</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* Region Information Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-blue-600 mb-1">Soil Type</h4>
                <p className="text-lg font-semibold">{selectedRegionData.soil_type || 'N/A'}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-green-600 mb-1">Avg Rainfall</h4>
                <p className="text-lg font-semibold">{selectedRegionData.average_rainfall || 'N/A'}mm</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-purple-600 mb-1">Altitude</h4>
                <p className="text-lg font-semibold">{selectedRegionData.altitude || 'N/A'}m</p>
              </div>
            </div>
          </section>
        </>
      ) : (
        // If no region selected, show a prompt but continue rendering other parts below
        <section className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-xl font-semibold mb-2">No Region Selected</h3>
          <p className="text-gray-600">Select a region above to view specific weather and recommendations. You can still browse planting calendars and resources.</p>
        </section>
      )}

      {/* Planting Calendar */}
      {selectedRegion && cropRecommendations.length > 0 && (
        <section className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <FiCalendar className="mr-2 text-green-600" />
            Annual Planting Calendar
          </h3>
          <div className="overflow-x-auto">
            <div className="grid grid-cols-12 gap-2 min-w-max">
              {months.map((month, index) => {
                const monthRecommendations = cropRecommendations.filter(
                  rec => rec.planting_month === month
                );

                return (
                  <div key={month} className="bg-gray-50 rounded-lg p-3 border border-gray-200 min-w-[80px]">
                    <h4 className="font-medium text-gray-800 text-center mb-2 text-xs">
                      {month.substring(0, 3)}
                    </h4>

                    {monthRecommendations.length > 0 ? (
                      <div className="space-y-1">
                        {monthRecommendations.slice(0, 3).map(rec => (
                          <div key={rec.id || rec.crop_name} className="text-xs bg-green-100 text-green-800 px-1 py-1 rounded text-center truncate">
                            {rec.crop_name}
                          </div>
                        ))}
                        {monthRecommendations.length > 3 && (
                          <div className="text-xs text-gray-500 text-center">
                            +{monthRecommendations.length - 3}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 text-center">No planting</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Help Section */}
      <section className="mt-6 p-6 bg-green-50 border-l-4 border-green-600 rounded-lg">
        <h3 className="text-xl font-semibold mb-2 flex items-center">
          <FiMapPin className="mr-2" />
          Need Personalized Advice?
        </h3>
        <p className="text-gray-700 mb-4">
          Connect with agricultural experts in your region for customized recommendations based on your specific farm conditions.
        </p>
        <div className="flex flex-wrap gap-3">
          <button className="bg-green-600 text-white px-5 py-2 rounded hover:bg-green-700 transition flex items-center">
            <FiMapPin className="mr-2" /> Find Local Agronomist
          </button>
          <button className="bg-white text-green-700 px-5 py-2 rounded border border-green-600 hover:bg-green-50 transition flex items-center">
            <FiCalendar className="mr-2" /> Schedule Farm Visit
          </button>
          <button className="bg-white text-gray-700 px-5 py-2 rounded border border-gray-300 hover:bg-gray-50 transition flex items-center">
            Ask Online Expert
          </button>
        </div>
      </section>

      {/* Resources Section */}
      <section className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-xl font-semibold mb-4">Additional Resources</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="https://openweathermap.org" className="border border-gray-200 rounded-lg p-4 hover:border-green-500 transition group" target="_blank" rel="noopener noreferrer">
            <div className="text-2xl mb-2">{getWeatherIcon('sunny')}</div>
            <h4 className="font-medium text-green-700 group-hover:text-green-800 mb-2">Weather Forecast</h4>
            <p className="text-sm text-gray-600">10-day weather predictions for your region</p>
          </a>
          <a href="#" className="border border-gray-200 rounded-lg p-4 hover:border-green-500 transition group">
            <div className="text-2xl mb-2">📊</div>
            <h4 className="font-medium text-green-700 group-hover:text-green-800 mb-2">Market Prices</h4>
            <p className="text-sm text-gray-600">Current commodity prices in nearby markets</p>
          </a>
          <a href="#" className="border border-gray-200 rounded-lg p-4 hover:border-green-500 transition group">
            <div className="text-2xl mb-2">🎥</div>
            <h4 className="font-medium text-green-700 group-hover:text-green-800 mb-2">Training Videos</h4>
            <p className="text-sm text-gray-600">Step-by-step guides for farming techniques</p>
          </a>
        </div>
      </section>
    </div>
  );
}

function RecommendationSection({ title, items, isExpanded, toggle, type }) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={toggle}
        className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition"
      >
        <h3 className="text-lg font-semibold text-left">{title}</h3>
        {isExpanded ? <FiChevronUp className="text-green-600" /> : <FiChevronDown className="text-green-600" />}
      </button>

      {isExpanded && (
        <div className="p-4 bg-white">
          {type === 'crops' ? (
            <div className="space-y-4">
              {items.length > 0 ? (
                items.map((rec, index) => (
                  <div key={rec.id || index} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-green-700 text-lg">{rec.crop_name}</h4>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            {rec.season ? rec.season.charAt(0).toUpperCase() + rec.season.slice(1) : 'N/A'}
                          </span>
                          {rec.planting_month && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              🌱 {rec.planting_month}
                            </span>
                          )}
                          {rec.harvesting_month && (
                            <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                              🌾 {rec.harvesting_month}
                            </span>
                          )}
                          {rec.expected_yield && (
                            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                              📊 {rec.expected_yield}
                            </span>
                          )}
                        </div>

                        {rec.water_requirements && (
                          <p className="mt-2 text-sm text-gray-600">
                            <FiDroplet className="inline mr-1 text-blue-500" />
                            Water: {rec.water_requirements}
                          </p>
                        )}

                        {rec.soil_requirements && (
                          <p className="mt-2 text-sm text-gray-600">
                            🧪 Soil: {rec.soil_requirements}
                          </p>
                        )}
                      </div>

                      <div className="ml-4 text-right">
                        <button className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300 mb-1">
                          Save
                        </button>
                        <button className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700">
                          Plan
                        </button>
                      </div>
                    </div>

                    {rec.description && (
                      <p className="mt-3 text-sm text-gray-700 italic bg-gray-50 p-2 rounded">
                        {rec.description}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>No crop recommendations available for this selection</p>
                </div>
              )}
            </div>
          ) : type === 'schedule' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map((item, index) => (
                <div key={index} className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-800">{item.crop}</h4>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-green-600">🌱 {item.planting}</span>
                    <span className="text-orange-600">🌾 {item.harvesting}</span>
                  </div>
                  {item.yield && <p className="text-xs text-gray-600 mt-1">Expected: {item.yield}</p>}
                </div>
              ))}
            </div>
          ) : (
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              {items.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default AgroClimate;
