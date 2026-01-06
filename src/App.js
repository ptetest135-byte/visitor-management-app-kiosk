import React, { useState, useEffect } from 'react';
import { LogOut, Plus, Eye, Trash2, Download, Home } from 'lucide-react';

export default function VisitorManagementApp() {
  const [screen, setScreen] = useState('home');
  const [adminPassword] = useState('123456789');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminLoginAttempt, setAdminLoginAttempt] = useState('');
  const [visitors, setVisitors] = useState([]);
  
  const [settings, setSettings] = useState({
    companyName: 'Welcome to epay Australia',
    subtitle: 'Visitors please sign in',
    notificationEmail: 'ptetest135@gmail.com',
    maxVisitors: 100
  });
  
  const [settingsForm, setSettingsForm] = useState({
    companyName: 'Welcome to epay Australia',
    subtitle: 'Visitors please sign in',
    notificationEmail: 'ptetest135@gmail.com',
    maxVisitors: 100
  });

  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    whomToMeet: '',
    company: '',
    purpose: '',
    relation: ''
  });
  
  const [additionalPeople, setAdditionalPeople] = useState([]);
  const [showAddMore, setShowAddMore] = useState(false);
  const [tempPerson, setTempPerson] = useState({
    name: '',
    relation: ''
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [submitMessage, setSubmitMessage] = useState('');
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [checkoutSearch, setCheckoutSearch] = useState('');
  const [checkoutResults, setCheckoutResults] = useState([]);

  useEffect(() => {
    loadVisitors();
    loadSettings();
  }, []);

  const loadVisitors = async () => {
    try {
      const result = await window.storage.get('visitors');
      if (result) {
        setVisitors(JSON.parse(result.value));
      }
    } catch (error) {
      console.log('No previous visitors found');
    }
  };

  const loadSettings = async () => {
    const defaultSettings = {
      companyName: 'Welcome to epay Australia',
      subtitle: 'Visitors please sign in',
      notificationEmail: 'ptetest135@gmail.com',
      maxVisitors: 100
    };
    
    try {
      const result = await window.storage.get('app-settings');
      if (result) {
        const loaded = JSON.parse(result.value);
        setSettings(loaded);
        setSettingsForm(loaded);
      } else {
        setSettings(defaultSettings);
        setSettingsForm(defaultSettings);
      }
    } catch (error) {
      setSettings(defaultSettings);
      setSettingsForm(defaultSettings);
    }
  };

  const saveVisitors = async (data) => {
    try {
      await window.storage.set('visitors', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving visitors:', error);
    }
  };

  const saveSettings = async (newSettings) => {
    try {
      await window.storage.set('app-settings', JSON.stringify(newSettings));
      setSettings(newSettings);
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.mobile.trim()) errors.mobile = 'Mobile number is required';
    if (!/^\d{10}$/.test(formData.mobile.replace(/\D/g, ''))) {
      errors.mobile = 'Mobile number must be 10 digits';
    }
    if (!formData.email.trim()) errors.email = 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Valid email is required';
    }
    if (!formData.whomToMeet.trim()) errors.whomToMeet = 'Person to meet is required';
    if (!formData.company.trim()) errors.company = 'Company is required';
    if (!formData.purpose.trim()) errors.purpose = 'Purpose is required';
    if (!formData.relation.trim()) errors.relation = 'Relation is required';

    const duplicate = visitors.find(v => 
      !v.checkOutTime && (
        v.email.toLowerCase() === formData.email.toLowerCase() ||
        v.mobile === formData.mobile
      )
    );
    
    if (duplicate) {
      const isDupe = duplicate.email.toLowerCase() === formData.email.toLowerCase();
      const fieldType = isDupe ? 'email' : 'phone number';
      errors.duplicate = `Visitor with this ${fieldType} already checked in.`;
    }

    const activeCount = visitors.filter(v => !v.checkOutTime).length;
    if (activeCount >= settings.maxVisitors) {
      errors.maxVisitors = `Maximum ${settings.maxVisitors} visitors allowed.`;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }
    setShowAddMore(true);
  };

  const submitVisitorReg = async () => {
    const newVisitor = {
      id: Date.now(),
      name: formData.name,
      mobile: formData.mobile,
      email: formData.email,
      whomToMeet: formData.whomToMeet,
      company: formData.company,
      purpose: formData.purpose,
      relation: formData.relation,
      additionalPeople: additionalPeople,
      timestamp: new Date().toLocaleString(),
      checkOutTime: null
    };

    const updated = [...visitors, newVisitor];
    setVisitors(updated);
    await saveVisitors(updated);
    await sendEmail(formData);

    setSubmitMessage('Registration completed!');
    setTimeout(() => {
      resetForm();
      setSubmitMessage('');
      setScreen('home');
    }, 2000);
  };

  const addPerson = () => {
    if (!tempPerson.name.trim() || !tempPerson.relation) {
      alert('Please enter name and relation');
      return;
    }
    setAdditionalPeople([...additionalPeople, tempPerson]);
    setTempPerson({ name: '', relation: '' });
  };

  const removePerson = (idx) => {
    setAdditionalPeople(additionalPeople.filter((_, i) => i !== idx));
  };

  const sendEmail = async (data) => {
    try {
      const extra = additionalPeople.length > 0
        ? additionalPeople.map(p => `${p.name} (${p.relation})`).join(', ')
        : 'None';

      console.log('Email sent to:', settings.notificationEmail);
      console.log('Visitor:', data.name, 'Additional:', extra);
    } catch (error) {
      console.error('Email error:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      mobile: '',
      email: '',
      whomToMeet: '',
      company: '',
      purpose: '',
      relation: ''
    });
    setAdditionalPeople([]);
    setShowAddMore(false);
    setTempPerson({ name: '', relation: '' });
    setFormErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSettingsChange = (e) => {
    const { name, value } = e.target;
    setSettingsForm(prev => ({ ...prev, [name]: value }));
  };

  const checkOutVisitor = async (id) => {
    const updated = visitors.map(v =>
      v.id === id ? { ...v, checkOutTime: new Date().toLocaleString() } : v
    );
    setVisitors(updated);
    await saveVisitors(updated);
  };

  const deleteVisitor = async (id) => {
    const updated = visitors.filter(v => v.id !== id);
    setVisitors(updated);
    await saveVisitors(updated);
  };

  const searchCheckout = (query) => {
    if (!query.trim()) {
      setCheckoutResults([]);
      return;
    }

    const clean = query.trim().toLowerCase();
    const isPhone = /^\d+$/.test(clean);

    const results = visitors.filter(v => {
      if (isPhone) {
        return v.mobile === clean && v.mobile.length === 10;
      }
      return v.email.toLowerCase() === clean;
    });

    setCheckoutResults(results);
  };

  const handleCheckoutChange = (e) => {
    const val = e.target.value;
    setCheckoutSearch(val);
    searchCheckout(val);
  };

  const doCheckout = async (id) => {
    const updated = visitors.map(v =>
      v.id === id && !v.checkOutTime ? { ...v, checkOutTime: new Date().toLocaleString() } : v
    );
    setVisitors(updated);
    await saveVisitors(updated);
    setCheckoutSearch('');
    setCheckoutResults([]);
    setSubmitMessage('Visitor checked out!');
    setTimeout(() => setSubmitMessage(''), 2000);
  };

  const downloadCSV = () => {
    const headers = ['Visitor', 'Mobile', 'Email', 'Relation', 'Company', 'Meeting', 'Purpose', 'Additional', 'Check In', 'Check Out'];
    const rows = visitors.map(v => {
      const extra = v.additionalPeople && v.additionalPeople.length > 0
        ? v.additionalPeople.map(p => `${p.name} (${p.relation})`).join('; ')
        : '-';
      
      return [
        v.name,
        v.mobile,
        v.email,
        v.relation,
        v.company,
        v.whomToMeet,
        v.purpose,
        extra,
        v.timestamp,
        v.checkOutTime || '-'
      ];
    });

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    const el = document.createElement('a');
    el.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
    el.setAttribute('download', `visitors-${new Date().toISOString().split('T')[0]}.csv`);
    el.style.display = 'none';
    document.body.appendChild(el);
    el.click();
    document.body.removeChild(el);
  };

  // HOME SCREEN
  if (screen === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 md:p-12 max-w-md w-full text-center">
          <div className="mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">👥</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{settings.companyName}</h1>
            <p className="text-gray-600 text-lg">{settings.subtitle}</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                resetForm();
                setScreen('visitor-form');
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              Register Visitor
            </button>
            <button
              onClick={() => {
                setCheckoutSearch('');
                setCheckoutResults([]);
                setScreen('checkout');
              }}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2"
            >
              <LogOut size={20} />
              Sign Out Visitor
            </button>
            <button
              onClick={() => {
                setAdminLoginAttempt('');
                setScreen('admin');
              }}
              className="w-full bg-gray-700 hover:bg-gray-800 text-white font-bold py-3 px-4 rounded-lg"
            >
              Admin Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // CHECKOUT SCREEN
  if (screen === 'checkout') {
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => setScreen('home')}
            className="mb-4 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <Home size={18} />
            Home
          </button>

          <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Sign Out</h2>
            <p className="text-gray-600 mb-6">Search by email or phone (10 digits)</p>

            {submitMessage && (
              <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                {submitMessage}
              </div>
            )}

            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-2">Search</label>
              <input
                type="text"
                value={checkoutSearch}
                onChange={handleCheckoutChange}
                placeholder="Enter email or phone number"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg"
              />
            </div>

            {checkoutResults.length > 0 ? (
              <div className="space-y-4">
                {checkoutResults.map((visitor) => (
                  <div key={visitor.id} className="bg-gray-50 border-l-4 border-green-500 p-6 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-gray-600 text-sm">Name</p>
                        <p className="font-bold">{visitor.name}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Mobile</p>
                        <p className="font-bold">{visitor.mobile}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Email</p>
                        <p className="font-bold">{visitor.email}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Status</p>
                        <p className={`font-bold ${visitor.checkOutTime ? 'text-red-600' : 'text-yellow-600'}`}>
                          {visitor.checkOutTime ? 'Out' : 'In'}
                        </p>
                      </div>
                    </div>
                    {!visitor.checkOutTime && (
                      <button
                        onClick={() => doCheckout(visitor.id)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg"
                      >
                        Sign Out
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : checkoutSearch.trim() ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <p className="text-yellow-700 font-semibold">No visitors found</p>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                <p className="text-blue-700">Enter email or phone to search</p>
              </div>
            )}

            <button
              onClick={() => setScreen('home')}
              className="w-full mt-6 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-lg"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // VISITOR FORM SCREEN
  if (screen === 'visitor-form') {
    if (showAddMore) {
      return (
        <div className="min-h-screen bg-gray-100 p-4 md:p-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Add People</h2>
              <p className="text-gray-600 mb-6">Visitor: <span className="font-bold">{formData.name}</span></p>

              {additionalPeople.length > 0 && (
                <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="font-bold text-gray-800 mb-3">Added ({additionalPeople.length}):</h3>
                  <div className="space-y-2">
                    {additionalPeople.map((person, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white p-3 rounded border border-gray-300">
                        <div>
                          <p className="font-bold">{person.name}</p>
                          <p className="text-sm text-gray-600">{person.relation}</p>
                        </div>
                        <button
                          onClick={() => removePerson(idx)}
                          className="bg-red-500 text-white px-3 py-1 rounded text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4 mb-6 bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-bold">Add Another</h3>
                
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Name</label>
                  <input
                    type="text"
                    value={tempPerson.name}
                    onChange={(e) => setTempPerson({ ...tempPerson, name: e.target.value })}
                    placeholder="Enter name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Relation</label>
                  <select
                    value={tempPerson.relation}
                    onChange={(e) => setTempPerson({ ...tempPerson, relation: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select</option>
                    <option value="Friend">Friend</option>
                    <option value="Family">Family</option>
                    <option value="Colleague">Colleague</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Child">Child</option>
                    <option value="Parent">Parent</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <button
                  onClick={addPerson}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg"
                >
                  Add
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={submitVisitorReg}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg"
                >
                  Complete
                </button>
                <button
                  onClick={() => setShowAddMore(false)}
                  className="px-6 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-lg"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    resetForm();
                    setScreen('home');
                  }}
                  className="px-6 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => setScreen('home')}
            className="mb-4 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <Home size={18} />
            Home
          </button>

          <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Register</h2>
            <p className="text-gray-600 mb-6">Fill all required fields</p>

            {Object.keys(formErrors).length > 0 && (
              <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                <p className="font-bold">Errors:</p>
                <ul className="list-disc list-inside mt-2 text-sm">
                  {Object.entries(formErrors).map(([key, val]) => (
                    <li key={key}>{val}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Full name"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Mobile *</label>
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="10 digits"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Email"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Relation *</label>
                  <select
                    name="relation"
                    value={formData.relation}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select</option>
                    <option value="Friend">Friend</option>
                    <option value="Family">Family</option>
                    <option value="Business">Business</option>
                    <option value="Client">Client</option>
                    <option value="Partner">Partner</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Meet *</label>
                  <input
                    type="text"
                    name="whomToMeet"
                    value={formData.whomToMeet}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Person name"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Company *</label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Company"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Purpose *</label>
                  <input
                    type="text"
                    name="purpose"
                    value={formData.purpose}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Visit purpose"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSubmit}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg"
                >
                  Submit
                </button>
                <button
                  onClick={() => setScreen('home')}
                  className="px-6 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ADMIN LOGIN
  if (screen === 'admin') {
    if (!isAdminLoggedIn) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Admin Login</h2>
            <div className="space-y-4">
              <input
                type="password"
                value={adminLoginAttempt}
                onChange={(e) => setAdminLoginAttempt(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Password"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && adminLoginAttempt === adminPassword) {
                    setIsAdminLoggedIn(true);
                  }
                }}
              />
              <button
                onClick={() => {
                  if (adminLoginAttempt === adminPassword) {
                    setIsAdminLoggedIn(true);
                    setAdminLoginAttempt('');
                  } else {
                    alert('Invalid password');
                    setAdminLoginAttempt('');
                  }
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg"
              >
                Login
              </button>
              <button
                onClick={() => setScreen('home')}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 rounded-lg"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      );
    }

    // ADMIN DASHBOARD
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
              <p className="text-gray-600">
                Primary: {visitors.length} | Inside: {visitors.filter(v => !v.checkOutTime).length}/{settings.maxVisitors} | Total: {visitors.reduce((t, v) => t + 1 + (v.additionalPeople?.length || 0), 0)}
              </p>
            </div>
            <button
              onClick={() => {
                setIsAdminLoggedIn(false);
                setScreen('home');
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-bold"
            >
              <LogOut size={20} />
              Out
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex flex-wrap gap-4">
              <button
                onClick={downloadCSV}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2"
              >
                <Download size={20} />
                CSV
              </button>
              
              <button
                onClick={() => setScreen('home')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold"
              >
                Home
              </button>
            </div>
          </div>

          {visitors.length === 0 ? (
            <div className="bg-white rounded-lg shadow-lg p-12 text-center">
              <p className="text-gray-500">No visitors</p>
            </div>
          ) : (
            <div className="space-y-4">
              {visitors.map((visitor) => (
                <div key={visitor.id} className="bg-white rounded-lg shadow p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-gray-600 text-sm">Name</p>
                      <p className="font-bold">{visitor.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Mobile</p>
                      <p className="font-bold">{visitor.mobile}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Email</p>
                      <p className="font-bold text-sm">{visitor.email}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Relation</p>
                      <p className="font-bold">{visitor.relation}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Company</p>
                      <p className="font-bold">{visitor.company}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Meet</p>
                      <p className="font-bold">{visitor.whomToMeet}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">In</p>
                      <p className="font-bold text-green-600">{visitor.timestamp}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Out</p>
                      <p className={`font-bold ${visitor.checkOutTime ? 'text-red-600' : 'text-yellow-600'}`}>
                        {visitor.checkOutTime || 'Pending'}
                      </p>
                    </div>
                  </div>

                  {visitor.additionalPeople && visitor.additionalPeople.length > 0 && (
                    <div className="mb-4 p-4 bg-blue-50 rounded border border-blue-200">
                      <p className="font-bold text-gray-800 mb-2">Additional ({visitor.additionalPeople.length}):</p>
                      {visitor.additionalPeople.map((person, idx) => (
                        <p key={idx} className="text-gray-700 text-sm">
                          {person.name} ({person.relation})
                        </p>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 pt-4 border-t">
                    {!visitor.checkOutTime && (
                      <button
                        onClick={() => checkOutVisitor(visitor.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2 font-bold"
                      >
                        <Eye size={16} />
                        Out
                      </button>
                    )}
                    <button
                      onClick={() => deleteVisitor(visitor.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center gap-2 font-bold"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
}
