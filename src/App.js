import React, { useState, useEffect } from 'react';
import { LogOut, Plus, Eye, Trash2, Download, Home, Settings } from 'lucide-react';

export default function VisitorManagementApp() {
  const [screen, setScreen] = useState('home');
  const [adminPassword] = useState('123456789');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminLoginAttempt, setAdminLoginAttempt] = useState('');
  const [visitors, setVisitors] = useState([]);
  
  // Settings State
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

  // Visitor Form State
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

  // Load data from storage on mount
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
        const loadedSettings = JSON.parse(result.value);
        setSettings(loadedSettings);
        setSettingsForm(loadedSettings);
      } else {
        setSettings(defaultSettings);
        setSettingsForm(defaultSettings);
      }
    } catch (error) {
      console.log('Using default settings');
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
      const isDuplicateEmail = duplicate.email.toLowerCase() === formData.email.toLowerCase();
      const fieldType = isDuplicateEmail ? 'email' : 'phone number';
      errors.duplicate = `A visitor with this ${fieldType} is already checked in. Please check them out first.`;
    }

    const activeVisitors = visitors.filter(v => !v.checkOutTime).length;
    if (activeVisitors >= settings.maxVisitors) {
      errors.maxVisitors = `Maximum ${settings.maxVisitors} visitors allowed at a time`;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    setShowAddMore(true);
  };

  const submitVisitorRegistration = async () => {
    const newVisitor = {
      id: Date.now(),
      ...formData,
      additionalPeople: additionalPeople,
      timestamp: new Date().toLocaleString(),
      checkOutTime: null
    };

    const updatedVisitors = [...visitors, newVisitor];
    setVisitors(updatedVisitors);
    await saveVisitors(updatedVisitors);
    await sendEmail(formData);

    setSubmitMessage('✓ Registration completed! All visitors checked in.');
    setTimeout(() => {
      resetForm();
      setSubmitMessage('');
      setScreen('home');
    }, 3000);
  };

  const addAdditionalPerson = () => {
    if (!tempPerson.name.trim() || !tempPerson.relation) {
      alert('Please enter name and select relation');
      return;
    }
    
    setAdditionalPeople([...additionalPeople, tempPerson]);
    setTempPerson({ name: '', relation: '' });
  };

  const removeAdditionalPerson = (index) => {
    setAdditionalPeople(additionalPeople.filter((_, i) => i !== index));
  };

  const sendEmail = async (visitorData) => {
    try {
      const additionalPeopleStr = additionalPeople.length > 0
        ? additionalPeople.map(p => `${p.name} (${p.relation})`).join(', ')
        : 'None';

      const emailContent = {
        service_id: 'service_visitor_management',
        template_id: 'template_visitor_registration',
        user_id: 'FN0gLR8k3BQh7lEWi',
        template_params: {
          to_email: settings.notificationEmail,
          visitor_name: visitorData.name,
          visitor_mobile: visitorData.mobile,
          visitor_email: visitorData.email,
          visitor_relation: visitorData.relation,
          visitor_company: visitorData.company,
          meeting_person: visitorData.whomToMeet,
          purpose: visitorData.purpose,
          additional_people: additionalPeopleStr,
          checkin_time: new Date().toLocaleString(),
          company_name: settings.companyName
        }
      };

      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailContent)
      });

      if (response.ok) {
        console.log('Email sent successfully');
      } else {
        console.log('Email notification would be sent to:', settings.notificationEmail);
      }
    } catch (error) {
      console.error('Email sending error:', error);
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
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSettingsChange = (e) => {
    const { name, value } = e.target;
    setSettingsForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const checkOutVisitor = async (id) => {
    const updatedVisitors = visitors.map(v =>
      v.id === id ? { ...v, checkOutTime: new Date().toLocaleString() } : v
    );
    setVisitors(updatedVisitors);
    await saveVisitors(updatedVisitors);
  };

  const deleteVisitor = async (id) => {
    const updatedVisitors = visitors.filter(v => v.id !== id);
    setVisitors(updatedVisitors);
    await saveVisitors(updatedVisitors);
  };

  const searchCheckoutVisitors = (query) => {
    if (!query.trim()) {
      setCheckoutResults([]);
      return;
    }

    const cleanQuery = query.trim().toLowerCase();
    const isPhoneNumber = /^\d+$/.test(cleanQuery);

    const results = visitors.filter(v => {
      if (isPhoneNumber) {
        return v.mobile === cleanQuery && v.mobile.length === 10;
      }
      return v.email.toLowerCase() === cleanQuery;
    });

    setCheckoutResults(results);
  };

  const handleCheckoutSearch = (e) => {
    const value = e.target.value;
    setCheckoutSearch(value);
    searchCheckoutVisitors(value);
  };

  const performCheckout = async (id) => {
    const updatedVisitors = visitors.map(v =>
      v.id === id && !v.checkOutTime ? { ...v, checkOutTime: new Date().toLocaleString() } : v
    );
    setVisitors(updatedVisitors);
    await saveVisitors(updatedVisitors);
    setCheckoutSearch('');
    setCheckoutResults([]);
    setSubmitMessage('✓ Visitor checked out successfully!');
    setTimeout(() => setSubmitMessage(''), 3000);
  };

  const downloadCSV = () => {
    const headers = ['Primary Visitor', 'Mobile', 'Email', 'Relation', 'Company', 'Meeting Person', 'Purpose', 'Additional People', 'Check-in Time', 'Check-out Time'];
    const rows = visitors.map(v => {
      const additionalPeopleStr = v.additionalPeople && v.additionalPeople.length > 0 
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
        additionalPeopleStr,
        v.timestamp,
        v.checkOutTime || '-'
      ];
    });

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
    element.setAttribute('download', `visitor-log-${new Date().toISOString().split('T')[0]}.csv`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Home Screen
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
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              Register Visitor
            </button>
            <button
              onClick={() => {
                setCheckoutSearch('');
                setCheckoutResults([]);
                setSubmitMessage('');
                setScreen('checkout');
              }}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
            >
              <LogOut size={20} />
              Sign Out Visitor
            </button>
            <button
              onClick={() => {
                setAdminLoginAttempt('');
                setScreen('admin');
              }}
              className="w-full bg-gray-700 hover:bg-gray-800 text-white font-bold py-3 px-4 rounded-lg transition"
            >
              Admin Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Checkout Screen
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
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Visitor Sign Out</h2>
            <p className="text-gray-600 mb-6">Search by Email or Complete Phone Number (10 digits)</p>

            {submitMessage && (
              <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                {submitMessage}
              </div>
            )}

            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-2">Search Visitor</label>
              <input
                type="text"
                value={checkoutSearch}
                onChange={handleCheckoutSearch}
                placeholder="Enter email or complete phone number (10 digits)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 text-lg"
              />
            </div>

            {checkoutResults.length > 0 ? (
              <div className="space-y-4">
                <p className="text-gray-700 font-semibold">Found {checkoutResults.length} visitor(s):</p>
                {checkoutResults.map((visitor) => (
                  <div key={visitor.id} className="bg-gray-50 border-l-4 border-green-500 p-6 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-gray-600 text-sm font-semibold">Name</p>
                        <p className="text-lg font-bold">{visitor.name}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm font-semibold">Mobile</p>
                        <p className="text-lg font-bold">{visitor.mobile}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm font-semibold">Email</p>
                        <p className="text-lg font-bold">{visitor.email}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm font-semibold">Company</p>
                        <p className="text-lg font-bold">{visitor.company}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm font-semibold">Check-in Time</p>
                        <p className="text-lg font-bold text-green-600">{visitor.timestamp}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm font-semibold">Status</p>
                        <p className={`text-lg font-bold ${visitor.checkOutTime ? 'text-red-600' : 'text-yellow-600'}`}>
                          {visitor.checkOutTime ? 'Checked Out' : 'Currently Inside'}
                        </p>
                      </div>
                    </div>
                    {!visitor.checkOutTime && (
                      <button
                        onClick={() => performCheckout(visitor.id)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition text-lg"
                      >
                        ✓ Confirm Sign Out
                      </button>
                    )}
                    {visitor.checkOutTime && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                        <p className="text-red-700 font-semibold">Already checked out at {visitor.checkOutTime}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : checkoutSearch.trim() ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <p className="text-yellow-700 font-semibold text-lg">No visitors found</p>
                <p className="text-yellow-600 mt-2">Enter complete email or complete phone number (10 digits)</p>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                <p className="text-blue-700 text-lg">Enter complete email or phone number to search</p>
              </div>
            )}

            <button
              onClick={() => setScreen('home')}
              className="w-full mt-6 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Visitor Form Screen
  if (screen === 'visitor-form') {
    if (showAddMore) {
      return (
        <div className="min-h-screen bg-gray-100 p-4 md:p-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Add Additional People</h2>
              <p className="text-gray-600 mb-6">Primary Visitor: <span className="font-bold">{formData.name}</span></p>

              {submitMessage && (
                <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                  {submitMessage}
                </div>
              )}

              {additionalPeople.length > 0 && (
                <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="font-bold text-gray-800 mb-3">People Added ({additionalPeople.length}):</h3>
                  <div className="space-y-2">
                    {additionalPeople.map((person, index) => (
                      <div key={index} className="flex justify-between items-center bg-white p-3 rounded border border-gray-300">
                        <div>
                          <p className="font-bold">{person.name}</p>
                          <p className="text-sm text-gray-600">Relation: {person.relation}</p>
                        </div>
                        <button
                          onClick={() => removeAdditionalPerson(index)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm font-bold"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4 mb-6 bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800">Add Another Person</h3>
                
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Name</label>
                  <input
                    type="text"
                    value={tempPerson.name}
                    onChange={(e) => setTempPerson({ ...tempPerson, name: e.target.value })}
                    placeholder="Enter person's name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Relation</label>
                  <select
                    value={tempPerson.relation}
                    onChange={(e) => setTempPerson({ ...tempPerson, relation: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select Relation</option>
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
                  onClick={addAdditionalPerson}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition"
                >
                  + Add Person
                </button>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  onClick={submitVisitorRegistration}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition text-lg"
                >
                  ✓ Complete Registration
                </button>
                <button
                  onClick={() => setShowAddMore(false)}
                  className="px-6 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-lg transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    resetForm();
                    setScreen('home');
                  }}
                  className="px-6 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition"
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
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Visitor Registration</h2>
            <p className="text-gray-600 mb-6">Please fill in all required fields (*)</p>

            {submitMessage && (
              <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                {submitMessage}
              </div>
            )}

            {Object.keys(formErrors).length > 0 && (
              <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                <p className="font-bold">Please fix errors:</p>
                <ul className="list-disc list-inside mt-2 text-sm">
                  {Object.entries(formErrors).map(([key, value]) => (
                    <li key={key}>{value}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
                      formErrors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Mobile Number *</label>
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
                      formErrors.mobile ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="10-digit number"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
                      formErrors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Relation *</label>
                  <select
                    name="relation"
                    value={formData.relation}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
                      formErrors.relation ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Relation</option>
                    <option value="Friend">Friend</option>
                    <option value="Family">Family</option>
                    <option value="Business">Business</option>
                    <option value="Client">Client</option>
                    <option value="Partner">Partner</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Person to Meet *</label>
                  <input
                    type="text"
                    name="whomToMeet"
                    value={formData.whomToMeet}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
                      formErrors.whomToMeet ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Name of person"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Company *</label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
                      formErrors.company ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Your company"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Purpose of Visit *</label>
                  <input
                    type="text"
                    name="purpose"
                    value={formData.purpose}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
                      formErrors.purpose ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Reason for visit"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition text-lg"
                >
                  Submit Registration
                </button>
                <button
                  type="button"
                  onClick={() => setScreen('home')}
                  className="px-6 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-lg transition"
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

  // Admin Login
  if (screen === 'admin') {
    if (!isAdminLoggedIn) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Admin Login</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Password</label>
                <input
                  type="password"
                  value={adminLoginAttempt}
                  onChange={(e) => setAdminLoginAttempt(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="Enter admin password"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && adminLoginAttempt === adminPassword) {
                      setIsAdminLoggedIn(true);
                      setAdminLoginAttempt('');
                    }
                  }}
                />
              </div>
              <button
                onClick={() => {
                  if (adminLoginAttempt === adminPassword) {
                    setIsAdminLoggedIn(true);
                    setAdminLoginAttempt('');
                  } else {
                    alert('Invalid password');
                  }
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition"
              >
                Login
              </button>
              <button
                onClick={() => setScreen('home')}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Admin Settings
    if (screen === 'admin-settings') {
      return (
        <div className="min-h-screen bg-white p-8">
          <button
            onClick={() => setScreen('admin')}
            className="mb-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded font-bold text-lg"
          >
            ← Back
          </button>

          <h1 className="text-4xl font-bold text-black mb-8">Settings</h1>

          {settingsSaved && (
            <div className="mb-6 p-4 bg-green-300 text-black rounded font-bold text-lg">
              ✓ Settings Saved!
            </div>
          )}

          <div className="mb-10 pb-10 border-b-2 border-gray-400">
            <h2 className="text-2xl font-bold text-black mb-2">Maximum Visitors Allowed</h2>
            <p className="text-gray-700 mb-4">Maximum visitors at same time</p>
            <input
              type="number"
              name="maxVisitors"
              value={settingsForm.maxVisitors}
              onChange={handleSettingsChange}
              min="1"
              className="w-full px-4 py-3 border-2 border-gray-400 rounded text-lg text-black bg-white"
            />
            <p className="text-black font-bold mt-3 text-lg">Current: {settingsForm.maxVisitors}</p>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => saveSettings(settingsForm)}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded font-bold text-lg"
            >
              Save Settings
            </button>
            <button
              type="button"
              onClick={() => {
                setSettingsForm(settings);
                setScreen('admin');
              }}
              className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-4 rounded font-bold text-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    // Admin Dashboard
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
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
              Sign Out
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() => downloadCSV()}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold text-base flex items-center gap-2"
              >
                <Download size={20} />
                Download CSV
              </button>

              <button
                type="button"
                onClick={() => setScreen('admin-settings')}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-bold text-base flex items-center gap-2"
              >
                <Settings size={20} />
                Settings
              </button>
              
              <button
                type="button"
                onClick={() => setScreen('home')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold text-base"
              >
                Back Home
              </button>
            </div>
          </div>

          {visitors.length === 0 ? (
            <div className="bg-white rounded-lg shadow-lg p-12 text-center">
              <p className="text-gray-500 text-lg">No visitors registered yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {visitors.map((visitor) => (
                <div key={visitor.id} className="bg-white rounded-lg shadow p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-gray-600 text-sm">Name</p>
                      <p className="font-bold text-lg">{visitor.name}</p>
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
                      <p className="text-gray-600 text-sm">Relation</p>
                      <p className="font-bold">{visitor.relation}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Company</p>
                      <p className="font-bold">{visitor.company}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Meeting Person</p>
                      <p className="font-bold">{visitor.whomToMeet}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Purpose</p>
                      <p className="font-bold">{visitor.purpose}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Check-in</p>
                      <p className="font-bold text-green-600">{visitor.timestamp}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Check-out</p>
                      <p className={`font-bold ${visitor.checkOutTime ? 'text-red-600' : 'text-yellow-600'}`}>
                        {visitor.checkOutTime || 'Pending'}
                      </p>
                    </div>
                  </div>

                  {visitor.additionalPeople && visitor.additionalPeople.length > 0 && (
                    <div className="mb-4 p-4 bg-blue-50 rounded border border-blue-200">
                      <p className="font-bold text-gray-800 mb-2">Additional People ({visitor.additionalPeople.length}):</p>
                      <div className="space-y-1">
                        {visitor.additionalPeople.map((person, idx) => (
                          <p key={idx} className="text-gray-700 text-sm">
                            • {person.name} <span className="text-gray-600">({person.relation})</span>
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4 border-t">
                    {!visitor.checkOutTime && (
                      <button
                        onClick={() => checkOutVisitor(visitor.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2 font-bold"
                      >
                        <Eye size={16} />
                        Check Out
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
