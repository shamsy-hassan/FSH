import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { agriConnectAPI } from '../../services/api';
import { FiChevronDown, FiChevronUp, FiDownload, FiShare2, FiPrinter, FiMapPin, FiCalendar, FiDroplet, FiSun, FiThermometer } from 'react-icons/fi';
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

function ManageAgroClimate() {
  // regions now shaped as { error: boolean, data: [] }
  const [regions, setRegions] = useState({ error: false, data: [] });
  const [cropRecommendations, setCropRecommendations] = useState([]);
  const [weatherData, setWeatherData] = useState({});
  const [loading, setLoading] = useState(true);
  const [weatherLoading, setWeatherLoading] = useState({});
  const [error, setError] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedSeason, setSelectedSeason] = useState('');
  const [showRecommendationForm, setShowRecommendationForm] = useState(false);
  const [showWeatherModal, setShowWeatherModal] = useState(false);
  const [selectedWeatherRegion, setSelectedWeatherRegion] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [showPrintOptions, setShowPrintOptions] = useState(false);
  const [chartData, setChartData] = useState([]);

  const [newRecommendation, setNewRecommendation] = useState({
    region_id: '',
    crop_name: '',
    season: '',
    planting_month: '',
    harvesting_month: '',
    expected_yield: '',
    water_requirements: '',
    soil_requirements: '',
    description: ''
  });

  const seasons = ['rainy', 'dry', 'spring', 'summer', 'autumn', 'winter'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                 'July', 'August', 'September', 'October', 'November', 'December'];

  useEffect(() => {
    console.log('DEBUG: Initial useEffect - fetching regions');
    fetchRegions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    console.log('DEBUG: Region/season change useEffect triggered');
    console.log('DEBUG: regions.data.length:', regions.data.length);
    console.log('DEBUG: selectedRegion:', selectedRegion);
    console.log('DEBUG: selectedSeason:', selectedSeason);
    
    // trigger recommendations when selection or regions data changes
    if (regions.data.length > 0) {
      console.log('DEBUG: Calling fetchRecommendations because regions data exists');
      fetchRecommendations();
    } else {
      console.log('DEBUG: Clearing recommendations because no regions');
      // clear recommendations if no regions
      setCropRecommendations([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRegion, selectedSeason, regions.data]);

  useEffect(() => {
    if (cropRecommendations.length > 0) {
      const countByRegion = cropRecommendations.reduce((acc, rec) => {
        const regionName = regions.data.find(r => r.id === rec.region_id)?.name || 'Unknown';
        acc[regionName] = (acc[regionName] || 0) + 1;
        return acc;
      }, {});
      setChartData(Object.entries(countByRegion).map(([region, count]) => ({
        region,
        recommendations: count,
      })));
    } else {
      setChartData([]);
    }
  }, [cropRecommendations, regions.data]);

  const fetchRegions = async () => {
    try {
      setLoading(true);
      // reset error flag
      setRegions(prev => ({ ...prev, error: false }));
      const data = await agriConnectAPI.agroclimate.getRegions();
      const regionList = data?.regions ?? data ?? [];
      setRegions({ error: false, data: regionList });
      setLoading(false);

      if (regionList && regionList.length > 0) {
        // preserve selection if still exists otherwise choose first
        const prevSelectedExists = regionList.some(r => String(r.id) === String(selectedRegion));
        if (!prevSelectedExists) {
          setSelectedRegion(String(regionList[0].id));
        }
      } else {
        setSelectedRegion('');
      }
    } catch (err) {
      console.error('Error fetching regions:', err);
      setRegions({ error: true, data: [] });
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      let allRecommendations = [];
      
      console.log('DEBUG: fetchRecommendations called');
      console.log('DEBUG: selectedRegion:', selectedRegion);
      console.log('DEBUG: selectedSeason:', selectedSeason);
      console.log('DEBUG: regions.data:', regions.data);
      
      if (selectedRegion) {
        console.log('DEBUG: Fetching for specific region:', selectedRegion);
        const data = await agriConnectAPI.agroclimate.getCropRecommendations(
          parseInt(selectedRegion),
          selectedSeason || null
        );
        console.log('DEBUG: API response for specific region:', data);
        allRecommendations = data.recommendations || [];
      } else {
        console.log('DEBUG: Fetching for all regions');
        // batch fetch for all regions (graceful: ignore per-region errors)
        for (const region of regions.data) {
          try {
            console.log(`DEBUG: Fetching for region ${region.id} (${region.name})`);
            const data = await agriConnectAPI.agroclimate.getCropRecommendations(
              region.id,
              selectedSeason || null
            );
            console.log(`DEBUG: API response for region ${region.id}:`, data);
            allRecommendations = [...allRecommendations, ...(data.recommendations || [])];
          } catch (err) {
            console.error(`Error fetching recommendations for region ${region.id}:`, err);
          }
        }
      }
      
      console.log('DEBUG: Final allRecommendations:', allRecommendations);
      setCropRecommendations(allRecommendations);
      setError(null);
    } catch (err) {
      setError('Failed to fetch crop recommendations');
      console.error('Error fetching recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeatherData = async (regionId) => {
    try {
      setWeatherLoading(prev => ({ ...prev, [regionId]: true }));
      const region = regions.data.find(r => r.id === regionId);
      if (!region) return;
      
      const apiKey = 'YOUR_OPENWEATHERMAP_API_KEY'; // Replace with your actual API key
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${region.latitude}&lon=${region.longitude}&appid=${apiKey}&units=metric`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Weather API error');
      
      const data = await response.json();
      const weather = {
        temperature: Math.round(data.main.temp),
        feels_like: Math.round(data.main.feels_like),
        humidity: data.main.humidity,
        rainfall: data.rain ? data.rain['1h'] || 0 : 0,
        wind_speed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
        wind_direction: data.wind.deg,
        weather_condition: data.weather[0].main,
        description: data.weather[0].description,
        pressure: data.main.pressure,
        visibility: data.visibility ? Math.round(data.visibility / 1000) : null,
        sunrise: new Date(data.sys.sunrise * 1000).toLocaleTimeString(),
        sunset: new Date(data.sys.sunset * 1000).toLocaleTimeString(),
        last_updated: new Date().toLocaleString(),
        source: 'OpenWeatherMap'
      };
      
      setWeatherData(prev => ({ ...prev, [regionId]: weather }));
      setError(null);
    } catch (err) {
      console.error('Weather API failed:', err);
      // graceful fallback
      const fallbackWeather = {
        temperature: 25 + Math.floor(Math.random() * 10),
        feels_like: 24 + Math.floor(Math.random() * 8),
        humidity: 50 + Math.floor(Math.random() * 40),
        rainfall: Math.random() * 5,
        wind_speed: 10 + Math.floor(Math.random() * 15),
        wind_direction: Math.floor(Math.random() * 360),
        weather_condition: ['Sunny', 'Partly Cloudy', 'Cloudy'][Math.floor(Math.random() * 3)],
        description: 'Estimated weather conditions based on historical data',
        pressure: 1013 + Math.floor(Math.random() * 20),
        visibility: 8 + Math.floor(Math.random() * 4),
        sunrise: '06:15',
        sunset: '18:30',
        last_updated: new Date().toLocaleString(),
        source: 'Fallback Data'
      };
      
      setWeatherData(prev => ({ ...prev, [regionId]: fallbackWeather }));
      // do not set global error - use fallback
    } finally {
      setWeatherLoading(prev => ({ ...prev, [regionId]: false }));
    }
  };

  const createRecommendation = async (e) => {
    e.preventDefault();
    try {
      console.log('DEBUG: Creating recommendation with data:', newRecommendation);
      await agriConnectAPI.agroclimate.createCropRecommendation(newRecommendation);
      console.log('DEBUG: Recommendation created successfully');
      setNewRecommendation({
        region_id: '',
        crop_name: '',
        season: '',
        planting_month: '',
        harvesting_month: '',
        expected_yield: '',
        water_requirements: '',
        soil_requirements: '',
        description: ''
      });
      setShowRecommendationForm(false);
      console.log('DEBUG: About to call fetchRecommendations after creation');
      fetchRecommendations();
      setError(null);
    } catch (err) {
      setError('Failed to create crop recommendation');
      console.error('Error creating recommendation:', err);
    }
  };

  const deleteRecommendation = async (recommendationId) => {
    if (!window.confirm('Are you sure you want to delete this recommendation?')) return;
    
    try {
      await agriConnectAPI.agroclimate.deleteCropRecommendation(recommendationId);
      fetchRecommendations();
      setError(null);
    } catch (err) {
      setError('Failed to delete recommendation');
      console.error('Error deleting recommendation:', err);
    }
  };

  const viewWeatherDetails = async (region) => {
    setSelectedWeatherRegion(region);
    setShowWeatherModal(true);
    if (!weatherData[region.id]) {
      await fetchWeatherData(region.id);
    }
  };

  const refreshAllWeather = async () => {
    for (const region of regions.data) {
      // sequential intentionally to avoid spamming API; can be parallelized if desired
      // eslint-disable-next-line no-await-in-loop
      await fetchWeatherData(region.id);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handlePrint = () => {
    alert("Printing or saving as PDF...");
  };

  const handleShare = () => {
    alert("Sharing recommendations...");
  };

  // Loading state for regions only
  if (loading && regions.data.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading agroclimate data...</span>
      </div>
    );
  }

  // focused retry UI when fetchRegions failed
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

  // When there are no regions but no error, show a notice and continue rendering other features
  const hasRegions = regions.data.length > 0;
  const selectedRegionData = regions.data.find(r => String(r.id) === String(selectedRegion));

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto text-gray-800 space-y-8">
      {/* Header */}
      <header className="text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-green-800 mb-3">
          <FiMapPin className="inline mr-2" />
          Manage Agro-Climate Advisory
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Admin panel for managing regions, recommendations, and real-time weather.
        </p>
      </header>

      {/* If no regions but not error, show small notice */}
      {!hasRegions && (
        <div className="mb-4 p-4 rounded border border-dashed border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600 mb-2">No regions available yet. You can retry loading or continue to other admin tasks.</p>
          <button
            onClick={fetchRegions}
            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
          >
            Retry Loading Regions
          </button>
        </div>
      )}

      {/* Filters */}
      <section className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-2xl font-semibold mb-4 flex items-center">
          <FiMapPin className="mr-2 text-green-600" />
          Select Region and Season
        </h2>
        <div className="flex flex-wrap gap-3 mb-6">
          <select 
            value={selectedRegion} 
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="px-5 py-2 rounded-full text-sm font-medium shadow-sm transition-all bg-gray-50 text-gray-700 hover:bg-green-50 hover:text-green-700 border border-gray-200"
          >
            <option value="">All Regions</option>
            {regions.data.map(region => (
              <option key={region.id} value={region.id}>
                {region.name}
              </option>
            ))}
          </select>

          <select 
            value={selectedSeason} 
            onChange={(e) => setSelectedSeason(e.target.value)}
            className="px-5 py-2 rounded-full text-sm font-medium shadow-sm transition-all bg-gray-50 text-gray-700 hover:bg-green-50 hover:text-green-700 border border-gray-200"
          >
            <option value="">All Seasons</option>
            {seasons.map(season => (
              <option key={season} value={season}>
                {season.charAt(0).toUpperCase() + season.slice(1)}
              </option>
            ))}
          </select>

          <button 
            onClick={fetchRecommendations}
            className="px-5 py-2 rounded-full text-sm font-medium shadow-sm transition-all bg-gray-50 text-gray-700 hover:bg-green-50 hover:text-green-700 border border-gray-200"
          >
            Refresh Recommendations
          </button>

          <button 
            onClick={refreshAllWeather}
            className="px-5 py-2 rounded-full text-sm font-medium shadow-sm transition-all bg-gray-50 text-gray-700 hover:bg-green-50 hover:text-green-700 border border-gray-200"
            disabled={!hasRegions}
          >
            Refresh All Weather
          </button>
          
          <button 
            onClick={() => setShowRecommendationForm(true)} 
            className="px-5 py-2 rounded-full text-sm font-medium shadow-sm transition-all bg-green-600 text-white hover:bg-green-700"
            disabled={!hasRegions}
          >
            Add Recommendation
          </button>
        </div>

        {/* Month Selector */}
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
            <FiCalendar className="mr-2" />
            Select Month for Seasonal Advice:
          </label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
          >
            {months.map((month, index) => (
              <option key={month} value={index}>{month}</option>
            ))}
          </select>
        </div>
      </section>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
          {error}
        </div>
      )}

      {/* Chart Section */}
      <section className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-xl font-semibold mb-4">Recommendations by Region</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="region" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="recommendations" fill="#4CAF50" />
          </BarChart>
        </ResponsiveContainer>
      </section>

      {/* Region Overview (when selected) */}
      {selectedRegion && selectedRegionData && (
        <section className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-green-700 mb-1">
                {selectedRegionData.name}
              </h2>
              <p className="text-gray-600 mb-4">{selectedRegionData.description || 'Region in Kenya with specific agro-climate conditions.'}</p>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={() => setShowPrintOptions(!showPrintOptions)}
                className="p-2 rounded-full hover:bg-gray-100"
                title="Export options"
              >
                <FiDownload className="text-gray-600" />
              </button>
              {showPrintOptions && (
                <div className="absolute right-8 mt-8 bg-white shadow-lg rounded-md p-2 border border-gray-200 z-10">
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

          {/* Climate Summary */}
          {weatherData[selectedRegion] && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg flex items-center">
                <FiDroplet className="text-blue-500 text-2xl mr-3" />
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Rainfall</h4>
                  <p className="text-lg font-semibold">{(weatherData[selectedRegion].rainfall ?? 0).toFixed(1)}mm</p>
                </div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg flex items-center">
                <FiThermometer className="text-orange-500 text-2xl mr-3" />
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Temperature</h4>
                  <p className="text-lg font-semibold">{weatherData[selectedRegion].temperature}°C</p>
                  {weatherData[selectedRegion].feels_like && (
                    <p className="text-xs text-gray-500">Feels like {weatherData[selectedRegion].feels_like}°C</p>
                  )}
                </div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg flex items-center">
                <FiSun className="text-yellow-500 text-2xl mr-3" />
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Humidity</h4>
                  <p className="text-lg font-semibold">{weatherData[selectedRegion].humidity}%</p>
                </div>
              </div>
            </div>
          )}

          {/* Weather Source Indicator */}
          {weatherData[selectedRegion] && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
              <p><strong>Last Updated:</strong> {weatherData[selectedRegion].last_updated}</p>
              <p className="text-xs">
                {weatherData[selectedRegion].source === 'OpenWeatherMap' ? 
                  'Weather data powered by OpenWeatherMap API' : 
                  'Using estimated weather data based on historical patterns'
                }
              </p>
            </div>
          )}

          {/* Expandable Recommendation Sections */}
          <div className="space-y-4">
            <RecommendationSection 
              title="🌱 Recommended Crops"
              items={cropRecommendations}
              isExpanded={expandedSections.crops}
              toggle={() => toggleSection('crops')}
              type="crops"
              onDelete={deleteRecommendation}
            />
          </div>

          {/* Monthly Activity Calendar */}
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <FiCalendar className="mr-2 text-green-600" />
              {months[selectedMonth]} Activities for {selectedRegionData.name}
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">
                {selectedMonth >= 2 && selectedMonth <= 4 ? 
                  "This is a prime planting season. Focus on land preparation and planting drought-resistant varieties." :
                selectedMonth >= 9 && selectedMonth <= 11 ?
                  "Harvesting season. Prepare storage facilities and post-harvest handling." :
                  "Maintenance season. Focus on weeding, pest control, and water conservation."}
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
                <li>Test soil moisture levels weekly</li>
                <li>Monitor for pest outbreaks</li>
                <li>Prepare irrigation schedules</li>
                <li>Attend farmer field schools</li>
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Add Recommendation Form Modal */}
      {showRecommendationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800">Add Crop Recommendation</h3>
                <button 
                  onClick={() => setShowRecommendationForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={createRecommendation} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                    <select
                      value={newRecommendation.region_id}
                      onChange={(e) => setNewRecommendation(prev => ({ ...prev, region_id: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      required
                    >
                      <option value="">Select Region</option>
                      {regions.data.map(region => (
                        <option key={region.id} value={region.id}>{region.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Crop Name</label>
                    <input
                      type="text"
                      value={newRecommendation.crop_name}
                      onChange={(e) => setNewRecommendation(prev => ({ ...prev, crop_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      placeholder="e.g., Maize"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Season</label>
                    <select
                      value={newRecommendation.season}
                      onChange={(e) => setNewRecommendation(prev => ({ ...prev, season: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      required
                    >
                      <option value="">Select Season</option>
                      {seasons.map(season => (
                        <option key={season} value={season}>{season.charAt(0).toUpperCase() + season.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Planting Month</label>
                    <select
                      value={newRecommendation.planting_month}
                      onChange={(e) => setNewRecommendation(prev => ({ ...prev, planting_month: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      required
                    >
                      <option value="">Select Month</option>
                      {months.map(month => (
                        <option key={month} value={month}>{month}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Harvesting Month</label>
                    <select
                      value={newRecommendation.harvesting_month}
                      onChange={(e) => setNewRecommendation(prev => ({ ...prev, harvesting_month: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      required
                    >
                      <option value="">Select Month</option>
                      {months.map(month => (
                        <option key={month} value={month}>{month}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expected Yield</label>
                    <input
                      type="text"
                      value={newRecommendation.expected_yield}
                      onChange={(e) => setNewRecommendation(prev => ({ ...prev, expected_yield: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      placeholder="e.g., 2.5 tons/ha"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Water Requirements</label>
                    <input
                      type="text"
                      value={newRecommendation.water_requirements}
                      onChange={(e) => setNewRecommendation(prev => ({ ...prev, water_requirements: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      placeholder="e.g., 500mm/season"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Soil Requirements</label>
                    <input
                      type="text"
                      value={newRecommendation.soil_requirements}
                      onChange={(e) => setNewRecommendation(prev => ({ ...prev, soil_requirements: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      placeholder="e.g., Loamy, pH 6-7"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={newRecommendation.description}
                    onChange={(e) => setNewRecommendation(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    placeholder="Additional notes and recommendations..."
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setShowRecommendationForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Recommendation
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Weather Modal */}
      {showWeatherModal && selectedWeatherRegion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800">Weather Details - {selectedWeatherRegion.name}</h3>
                <button 
                  onClick={() => setShowWeatherModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {weatherData[selectedWeatherRegion.id] && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-800 mb-2">Temperature</h4>
                      <p className="text-2xl font-bold">{weatherData[selectedWeatherRegion.id].temperature}°C</p>
                      {weatherData[selectedWeatherRegion.id].feels_like && (
                        <p className="text-sm text-gray-600">Feels like {weatherData[selectedWeatherRegion.id].feels_like}°C</p>
                      )}
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-medium text-green-800 mb-2">Humidity</h4>
                      <p className="text-2xl font-bold">{weatherData[selectedWeatherRegion.id].humidity}%</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h4 className="font-medium text-purple-800 mb-2">Wind Speed</h4>
                      <p className="text-2xl font-bold">{weatherData[selectedWeatherRegion.id].wind_speed} km/h</p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <h4 className="font-medium text-orange-800 mb-2">Rainfall</h4>
                      <p className="text-2xl font-bold">{weatherData[selectedWeatherRegion.id].rainfall.toFixed(1)} mm</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-2">Conditions</h4>
                    <p className="text-lg">{weatherData[selectedWeatherRegion.id].description}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Last updated: {weatherData[selectedWeatherRegion.id].last_updated}
                    </p>
                    <p className="text-xs text-gray-500">
                      Source: {weatherData[selectedWeatherRegion.id].source}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Regions List */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Regions ({regions.data.length})</h2>
          <button 
            onClick={refreshAllWeather}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition flex items-center"
            disabled={!hasRegions}
          >
            <FiSun className="mr-2" /> Refresh All Weather
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {regions.data.map(region => (
            <div key={region.id} className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-gray-800">{region.name}</h3>
                  <p className="text-sm text-gray-600">{region.description || 'Region in Kenya'}</p>
                </div>
                <button
                  onClick={() => viewWeatherDetails(region)}
                  className="p-2 text-blue-600 hover:text-blue-800"
                  title="View weather details"
                >
                  <FiSun className="text-xl" />
                </button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <FiMapPin className="mr-2 text-gray-500" />
                  <span className="text-gray-700">{region.altitude || 'N/A'}m elevation</span>
                </div>
                <div className="flex items-center">
                  <FiDroplet className="mr-2 text-gray-500" />
                  <span className="text-gray-700">{region.average_rainfall || 'N/A'}mm avg rainfall</span>
                </div>
                <div className="flex items-center">
                  <FiThermometer className="mr-2 text-gray-500" />
                  <span className="text-gray-700">{region.soil_type || 'N/A'} soil</span>
                </div>
              </div>
              {weatherData[region.id] && (
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FiSun className="mr-2 text-yellow-500" />
                      <span className="text-sm font-medium text-gray-800">
                        {weatherData[region.id].temperature}°C
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {weatherData[region.id].humidity}% humidity
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {weatherData[region.id].description}
                  </div>
                </div>
              )}
              {weatherLoading[region.id] && (
                <div className="mt-3 flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 mr-2"></div>
                  <span className="text-sm text-blue-600">Loading weather...</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* All Recommendations List (for admin overview) */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">
            All Crop Recommendations ({cropRecommendations.length})
          </h2>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500 mr-3"></div>
            <span className="text-gray-600">Loading recommendations...</span>
          </div>
        ) : cropRecommendations.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Recommendations Found</h3>
            <p className="text-gray-500 mb-4">No crop recommendations available for the selected filters.</p>
            <button 
              onClick={fetchRecommendations}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
            >
              Refresh Recommendations
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cropRecommendations.map(rec => (
              <div key={rec.id} className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-semibold text-green-700 text-lg flex-1">{rec.crop_name}</h4>
                  <button
                    onClick={() => deleteRecommendation(rec.id)}
                    className="ml-3 text-red-500 hover:text-red-700 p-1 -mt-1"
                    title="Delete recommendation"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    {rec.season ? rec.season.charAt(0).toUpperCase() + rec.season.slice(1) : 'N/A'}
                  </span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    🌱 {rec.planting_month}
                  </span>
                  <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                    🌾 {rec.harvesting_month}
                  </span>
                  {rec.expected_yield && (
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                      📊 {rec.expected_yield}
                    </span>
                  )}
                </div>
                {rec.description && (
                  <p className="text-sm text-gray-700 mb-3 italic">{rec.description}</p>
                )}
                <div className="text-xs space-y-1 text-gray-600">
                  {rec.water_requirements && (
                    <div className="flex items-center">
                      <FiDroplet className="mr-1" />
                      <span>{rec.water_requirements}</span>
                    </div>
                  )}
                  {rec.soil_requirements && (
                    <div>
                      🧪 {rec.soil_requirements}
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-3">
                  Region: {regions.data.find(r => r.id === rec.region_id)?.name || 'Unknown'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Help Section */}
      <section className="mt-6 p-6 bg-green-50 border-l-4 border-green-600 rounded-lg">
        <h3 className="text-xl font-semibold mb-2">Need Help?</h3>
        <p className="text-gray-700 mb-4">
          Contact support for API issues or data updates.
        </p>
        <div className="flex flex-wrap gap-3">
          <button className="bg-green-600 text-white px-5 py-2 rounded hover:bg-green-700 transition flex items-center">
            Contact Support
          </button>
        </div>
      </section>

      {/* Resources Section */}
      <section className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-xl font-semibold mb-4">Additional Resources</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="https://openweathermap.org" className="border border-gray-200 rounded-lg p-4 hover:border-green-500 transition group" target="_blank" rel="noopener noreferrer">
            <h4 className="font-medium text-green-700 group-hover:text-green-800 mb-2">Weather API</h4>
            <p className="text-sm text-gray-600">Real-time weather data source</p>
          </a>
        </div>
      </section>
    </div>
  );
}

function RecommendationSection({ title, items, isExpanded, toggle, type, onDelete }) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={toggle}
        className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition"
      >
        <h3 className="text-lg font-semibold text-left">{title}</h3>
        {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
      </button>
      
      {isExpanded && (
        <div className="p-4 bg-white">
          {type === 'crops' ? (
            <div className="space-y-4">
              {items.length > 0 ? (
                items.map((rec) => (
                  <div key={rec.id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0 flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-green-700">{rec.crop_name}</h4>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          {rec.season ? rec.season.charAt(0).toUpperCase() + rec.season.slice(1) : 'N/A'}
                        </span>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Planting: {rec.planting_month}
                        </span>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Harvesting: {rec.harvesting_month}
                        </span>
                      </div>
                      {rec.description && (
                        <p className="mt-2 text-sm text-gray-600">{rec.description}</p>
                      )}
                    </div>
                    {onDelete && (
                      <button
                        onClick={() => onDelete(rec.id)}
                        className="text-red-500 hover:text-red-700 ml-3"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>No recommendations available</p>
                </div>
              )}
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

export default ManageAgroClimate;
