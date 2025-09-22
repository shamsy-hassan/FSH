import { useState, useEffect } from "react";
import { agriConnectAPI } from '../../services/api';

const categories = [
  { id: 'crop-production', name: 'Crop Production', icon: '🌱' },
  { id: 'livestock', name: 'Livestock Management', icon: '🐄' },
  { id: 'equipment', name: 'Farm Equipment', icon: '🚜' },
  { id: 'irrigation', name: 'Irrigation & Water', icon: '💧' },
  { id: 'organic', name: 'Organic Farming', icon: '🌿' },
  { id: 'post-harvest', name: 'Post-Harvest', icon: '🍎' },
  { id: 'business', name: 'Farm Business', icon: '📊' },
  { id: 'specialty', name: 'Specialty Crops', icon: '🌾' },
  { id: 'poultry', name: 'Poultry & Animals', icon: '🐓' },
  { id: 'agroforestry', name: 'Agroforestry', icon: '🌳' },
  { id: 'digital', name: 'Digital Farming', icon: '📱' },
  { id: 'technical', name: 'Technical Skills', icon: '🛠️' }
];

const difficulties = [
  { value: 'beginner', label: '🌱 Beginner' },
  { value: 'intermediate', label: '🌿 Intermediate' },
  { value: 'advanced', label: '🌳 Advanced' }
];

export default function ManageSkills() {
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState({
    category_id: "",
    title: "",
    description: "",
    content: "",
    difficulty: "beginner",
    estimated_time: "",
    tools_required: "",
    materials_required: "",
    is_active: true
  });

  const [editingSkillId, setEditingSkillId] = useState(null);
  const [editingSkillData, setEditingSkillData] = useState({
    category_id: "",
    title: "",
    description: "",
    content: "",
    difficulty: "beginner",
    estimated_time: "",
    tools_required: "",
    materials_required: "",
    is_active: true
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [selectedSkillForVideo, setSelectedSkillForVideo] = useState(null);
  const [newVideo, setNewVideo] = useState({
    skill_id: '',
    title: '',
    description: '',
    video_url: '',
    thumbnail_url: '',
    duration: '',
    is_active: true
  });

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await agriConnectAPI.skill.getSkills(null, null);
      setSkills(data.skills || []);
    } catch (err) {
      setError('Failed to fetch skills');
      console.error("Fetch skills error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = async (e) => {
    e.preventDefault();
    try {
      await agriConnectAPI.skill.createSkill(newSkill);
      setNewSkill({
        category_id: "",
        title: "",
        description: "",
        content: "",
        difficulty: "beginner",
        estimated_time: "",
        tools_required: "",
        materials_required: "",
        is_active: true
      });
      fetchSkills();
      setError(null);
    } catch (err) {
      setError('Failed to add skill');
      console.error("Add skill error:", err);
    }
  };

  const startEditing = (skill) => {
    setEditingSkillId(skill.id);
    setEditingSkillData({
      category_id: skill.category_id,
      title: skill.title,
      description: skill.description,
      content: skill.content || '',
      difficulty: skill.difficulty,
      estimated_time: skill.estimated_time || '',
      tools_required: skill.tools_required || '',
      materials_required: skill.materials_required || '',
      is_active: skill.is_active
    });
  };

  const cancelEditing = () => {
    setEditingSkillId(null);
    setEditingSkillData({
      category_id: "",
      title: "",
      description: "",
      content: "",
      difficulty: "beginner",
      estimated_time: "",
      tools_required: "",
      materials_required: "",
      is_active: true
    });
  };

  const saveEdit = async (id) => {
    try {
      await agriConnectAPI.skill.updateSkill(id, editingSkillData);
      setSkills((prev) =>
        prev.map((skill) => (skill.id === id ? { ...skill, ...editingSkillData } : skill))
      );
      cancelEditing();
      setError(null);
    } catch (err) {
      setError('Failed to update skill');
      console.error("Update skill error:", err);
    }
  };

  const deleteSkill = async (id) => {
    if (!window.confirm("Are you sure you want to delete this skill?")) return;
    try {
      await agriConnectAPI.skill.deleteSkill(id);
      setSkills((prev) => prev.filter((skill) => skill.id !== id));
      setError(null);
    } catch (err) {
      setError('Failed to delete skill');
      console.error("Delete skill error:", err);
    }
  };

  const toggleSkillStatus = async (skillId, currentStatus) => {
    try {
      const updatedData = { ...editingSkillData, is_active: !currentStatus };
      await agriConnectAPI.skill.updateSkill(skillId, updatedData);
      setSkills(prev => 
        prev.map(skill => 
          skill.id === skillId ? { ...skill, is_active: !currentStatus } : skill
        )
      );
      setError(null);
    } catch (err) {
      setError('Failed to update skill status');
      console.error('Error updating skill status:', err);
    }
  };

  const addVideo = async (e) => {
    e.preventDefault();
    try {
      await agriConnectAPI.skill.addSkillVideo(newVideo);
      setNewVideo({
        skill_id: '',
        title: '',
        description: '',
        video_url: '',
        thumbnail_url: '',
        duration: '',
        is_active: true
      });
      setShowVideoForm(false);
      setSelectedSkillForVideo(null);
      fetchSkills();
      setError(null);
    } catch (err) {
      setError('Failed to add video');
      console.error('Error adding video:', err);
    }
  };

  // Group skills by category
  const groupedSkills = skills.reduce((acc, skill) => {
    const categoryName = categories.find(c => c.id === skill.category_id)?.name || 'Uncategorized';
    acc[categoryName] = acc[categoryName] || [];
    acc[categoryName].push(skill);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        <span className="ml-3 text-gray-600">Loading skills...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-12 text-slate-900">
      {/* Page Title */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-green-700">Skills Management</h1>
        <p className="mt-2 text-gray-600">
          Add, update, and organize agricultural skills by category.
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
          {error}
          <button 
            onClick={() => setError(null)}
            className="float-right text-red-800 hover:text-red-900"
          >
            ×
          </button>
        </div>
      )}

      {/* Add New Skill Section */}
      <section className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
        <h2 className="text-2xl font-semibold mb-4 text-green-700">Add New Skill</h2>
        <form onSubmit={handleAddSkill} className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={newSkill.category_id}
              onChange={(e) => setNewSkill({ ...newSkill, category_id: e.target.value })}
              required
              className="w-full border border-gray-300 rounded px-4 py-2 focus:ring-2 focus:ring-green-500"
            >
              <option value="">Select Category</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
            <select
              value={newSkill.difficulty}
              onChange={(e) => setNewSkill({ ...newSkill, difficulty: e.target.value })}
              required
              className="w-full border border-gray-300 rounded px-4 py-2 focus:ring-2 focus:ring-green-500"
            >
              {difficulties.map(diff => (
                <option key={diff.value} value={diff.value}>
                  {diff.label}
                </option>
              ))}
            </select>
          </div>
          <input
            type="text"
            placeholder="Skill Title"
            value={newSkill.title}
            onChange={(e) => setNewSkill({ ...newSkill, title: e.target.value })}
            required
            className="border border-gray-300 rounded px-4 py-2 focus:ring-2 focus:ring-green-500"
          />
          <input
            type="text"
            placeholder="Estimated Time (e.g., 2 hours)"
            value={newSkill.estimated_time}
            onChange={(e) => setNewSkill({ ...newSkill, estimated_time: e.target.value })}
            className="border border-gray-300 rounded px-4 py-2 focus:ring-2 focus:ring-green-500"
          />
          <textarea
            placeholder="Skill Description"
            value={newSkill.description}
            onChange={(e) => setNewSkill({ ...newSkill, description: e.target.value })}
            required
            rows={2}
            className="md:col-span-2 border border-gray-300 rounded px-4 py-2 focus:ring-2 focus:ring-green-500 resize-none"
          />
          <textarea
            placeholder="Detailed Content"
            value={newSkill.content}
            onChange={(e) => setNewSkill({ ...newSkill, content: e.target.value })}
            rows={3}
            className="md:col-span-2 border border-gray-300 rounded px-4 py-2 focus:ring-2 focus:ring-green-500 resize-none"
          />
          <textarea
            placeholder="Tools Required (comma-separated)"
            value={newSkill.tools_required}
            onChange={(e) => setNewSkill({ ...newSkill, tools_required: e.target.value })}
            rows={2}
            className="md:col-span-2 border border-gray-300 rounded px-4 py-2 focus:ring-2 focus:ring-green-500 resize-none"
          />
          <textarea
            placeholder="Materials Required (comma-separated)"
            value={newSkill.materials_required}
            onChange={(e) => setNewSkill({ ...newSkill, materials_required: e.target.value })}
            rows={2}
            className="md:col-span-2 border border-gray-300 rounded px-4 py-2 focus:ring-2 focus:ring-green-500 resize-none"
          />
          <button
            type="submit"
            className="md:col-span-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded shadow transition"
          >
            Add Skill
          </button>
        </form>
      </section>

      {/* Add Video Section */}
      <section className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
        <h2 className="text-2xl font-semibold mb-4 text-green-700">Add Video to Skill</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Skill</label>
          <select
            value={selectedSkillForVideo?.id || ''}
            onChange={(e) => {
              const skill = skills.find(s => s.id === e.target.value);
              setSelectedSkillForVideo(skill);
              setNewVideo({ ...newVideo, skill_id: skill?.id || '' });
            }}
            className="w-full border border-gray-300 rounded px-4 py-2 focus:ring-2 focus:ring-green-500"
          >
            <option value="">Choose a skill...</option>
            {skills.map(skill => (
              <option key={skill.id} value={skill.id}>
                {skill.title} ({categories.find(c => c.id === skill.category_id)?.name})
              </option>
            ))}
          </select>
        </div>
        {selectedSkillForVideo && (
          <button
            onClick={() => setShowVideoForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded shadow transition mb-4"
          >
            Open Video Form
          </button>
        )}
      </section>

      {/* Video Form Modal */}
      {showVideoForm && selectedSkillForVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800">Add Video to {selectedSkillForVideo.title}</h3>
                <button 
                  onClick={() => {
                    setShowVideoForm(false);
                    setSelectedSkillForVideo(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={addVideo} className="space-y-4">
                <input
                  type="text"
                  placeholder="Video Title"
                  value={newVideo.title}
                  onChange={(e) => setNewVideo({...newVideo, title: e.target.value})}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
                <textarea
                  placeholder="Video Description"
                  value={newVideo.description}
                  onChange={(e) => setNewVideo({...newVideo, description: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
                <input
                  type="url"
                  placeholder="Video URL"
                  value={newVideo.video_url}
                  onChange={(e) => setNewVideo({...newVideo, video_url: e.target.value})}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="url"
                    placeholder="Thumbnail URL"
                    value={newVideo.thumbnail_url}
                    onChange={(e) => setNewVideo({...newVideo, thumbnail_url: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                  <input
                    type="number"
                    placeholder="Duration (seconds)"
                    value={newVideo.duration}
                    onChange={(e) => setNewVideo({...newVideo, duration: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowVideoForm(false);
                      setSelectedSkillForVideo(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Add Video
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Skills by Category Section */}
      <section>
        <h2 className="text-2xl font-semibold text-green-700 mb-6">Skills by Category</h2>

        {Object.keys(groupedSkills).length === 0 ? (
          <p className="text-gray-500">No skills added yet.</p>
        ) : (
          Object.entries(groupedSkills).map(([categoryName, catSkills]) => (
            <div key={categoryName} className="mb-10">
              <h3 className="text-xl font-bold text-green-600 mb-4 underline">{categoryName}</h3>
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-300 text-sm rounded shadow-md">
                  <thead className="bg-green-100 text-left">
                    <tr>
                      <th className="p-3 border">Title</th>
                      <th className="p-3 border">Description</th>
                      <th className="p-3 border">Difficulty</th>
                      <th className="p-3 border">Time</th>
                      <th className="p-3 border">Tools</th>
                      <th className="p-3 border text-center">Videos</th>
                      <th className="p-3 border text-center">Status</th>
                      <th className="p-3 border text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {catSkills.map((skill) => (
                      <tr key={skill.id} className="hover:bg-green-50">
                        {editingSkillId === skill.id ? (
                          <>
                            <td className="border p-2">
                              <input
                                value={editingSkillData.title}
                                onChange={(e) =>
                                  setEditingSkillData({ ...editingSkillData, title: e.target.value })
                                }
                                className="w-full px-2 py-1 border rounded"
                              />
                            </td>
                            <td className="border p-2">
                              <textarea
                                rows={2}
                                value={editingSkillData.description}
                                onChange={(e) =>
                                  setEditingSkillData({
                                    ...editingSkillData,
                                    description: e.target.value,
                                  })
                                }
                                className="w-full px-2 py-1 border rounded resize-none"
                              />
                            </td>
                            <td className="border p-2">
                              <select
                                value={editingSkillData.difficulty}
                                onChange={(e) =>
                                  setEditingSkillData({
                                    ...editingSkillData,
                                    difficulty: e.target.value,
                                  })
                                }
                                className="w-full px-2 py-1 border rounded"
                              >
                                {difficulties.map(diff => (
                                  <option key={diff.value} value={diff.value}>{diff.label}</option>
                                ))}
                              </select>
                            </td>
                            <td className="border p-2">
                              <input
                                value={editingSkillData.estimated_time}
                                onChange={(e) =>
                                  setEditingSkillData({
                                    ...editingSkillData,
                                    estimated_time: e.target.value,
                                  })
                                }
                                className="w-full px-2 py-1 border rounded"
                              />
                            </td>
                            <td className="border p-2">
                              <input
                                value={editingSkillData.tools_required}
                                onChange={(e) =>
                                  setEditingSkillData({
                                    ...editingSkillData,
                                    tools_required: e.target.value,
                                  })
                                }
                                className="w-full px-2 py-1 border rounded"
                              />
                            </td>
                            <td className="border p-2 text-center">
                              {skill.videos?.length || 0}
                            </td>
                            <td className="border p-2 text-center">
                              <select
                                value={editingSkillData.is_active ? 'active' : 'inactive'}
                                onChange={(e) =>
                                  setEditingSkillData({
                                    ...editingSkillData,
                                    is_active: e.target.value === 'active',
                                  })
                                }
                                className="px-2 py-1 border rounded"
                              >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                              </select>
                            </td>
                            <td className="border p-2 text-center space-x-2">
                              <button
                                onClick={() => saveEdit(skill.id)}
                                className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                              >
                                Save
                              </button>
                              <button
                                onClick={cancelEditing}
                                className="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500"
                              >
                                Cancel
                              </button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="border p-3">{skill.title}</td>
                            <td className="border p-3">{skill.description}</td>
                            <td className="border p-3">{skill.difficulty}</td>
                            <td className="border p-3">{skill.estimated_time}</td>
                            <td className="border p-3">{skill.tools_required}</td>
                            <td className="border p-3 text-center">{skill.videos?.length || 0}</td>
                            <td className="border p-3 text-center">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                skill.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {skill.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="border p-3 text-center space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedSkillForVideo(skill);
                                  setNewVideo({ ...newVideo, skill_id: skill.id });
                                  setShowVideoForm(true);
                                }}
                                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                                title="Add Video"
                              >
                                📹
                              </button>
                              <button
                                onClick={() => toggleSkillStatus(skill.id, skill.is_active)}
                                className={`px-3 py-1 rounded text-sm ${
                                  skill.is_active 
                                    ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                }`}
                                title={skill.is_active ? "Deactivate" : "Activate"}
                              >
                                {skill.is_active ? '❌' : '✅'}
                              </button>
                              <button
                                onClick={() => startEditing(skill)}
                                className="bg-yellow-400 text-white px-3 py-1 rounded hover:bg-yellow-500"
                                title="Edit"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => deleteSkill(skill.id)}
                                className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                                title="Delete"
                              >
                                🗑️
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}