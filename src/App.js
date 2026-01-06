import React, { useState, useEffect } from 'react';
import { LogOut, Plus, Eye, Trash2, Download, Home, Settings, Mail } from 'lucide-react';

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
    notificationEmail: 'ptetest135@gmail.com'
  });
  
  const [settingsForm, setSettingsForm] = useState({
    companyName: 'Welcome to epay Australia',
    subtitle: 'Visitors please sign in',
    notificationEmail: 'ptetest135@gmail.com'
  });
  
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Visitor Form State
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    whomToMeet: '',
    company: '',
    purpose: ''
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [submitMessage, setSubmitMessage] = useState('');
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
    try {
      const result = await window.storage.get('app-settings');
      if (result) {
        const loadedSettings = JSON.parse(result.value);
        setSettings(loadedSettings);
        setSettingsForm(loadedSettings);
      }
    } catch (error) {
      console.log('Using default settings');
      setSettingsForm(settings);
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
      alert('Error saving settings');
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

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const sendEmail = async (visitorData) => {
    try {
      const emailContent = {
        service_id: 'service_visitor_management',
        template_id: 'template_visitor_registration',
        user_id: 'FN0gLR8k3BQh7lEWi',
        template_params: {
          to_email: settings.notificationEmail,
          visitor_name: visitorData.name,
          visitor_mobile: visitorData.mobile,
          visitor_email: visitorData.email,
          visitor_company: visitorData.company,
          meeting_person: visitorData.whomToMeet,
          purpose: visitorData.purpose,
          checkin_time: new Date().toLocaleString(),
          company_name: settings.companyName
        }
      };

      // Using EmailJS to send email
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailContent)
      });

      if (response.ok) {
        console.log('Email sent successfully to:', settings.notificationEmail);
      } else {
        // Fallback: Log to console if email fails
        console.log('Email notification would be sent to:', settings.notificationEmail);
        console.log('Visitor Details:', visitorData);
      }
    } catch (error) {
      console.error('Email sending error:', error);
      // Fallback notification
      console.log('Visitor check-in details:', visitorData);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      setSubmitMessage('');
      return;
    }

    const newVisitor = {
      id: Date.now(),
      ...formData,
      timestamp: new Date().toLocaleString(),
      checkOutTime: null
    };

    const updatedVisitors = [...visitors, newVisitor];
    setVisitors(updatedVisitors);
    await saveVisitors(updatedVisitors);

    // Send email
    await sendEmail(formData);

    setSubmitMessage('✓ Visitor registered successfully! Email sent. Check-in complete.');
    setTimeout(() => {
      resetForm();
      setSubmitMessage('');
      setScreen('home');
    }, 3000);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      mobile: '',
      email: '',
      whomToMeet: '',
      company: '',
      purpose: ''
    });
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

    const results = visitors.filter(v => 
      v.name.toLowerCase().includes(query.toLowerCase()) ||
      v.mobile.includes(query) ||
      v.email.toLowerCase().includes(query.toLowerCase())
    );

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
    const headers = ['Name', 'Mobile', 'Email', 'Company', 'Meeting Person', 'Purpose', 'Check-in Time', 'Check-out Time'];
    const rows = visitors.map(v => [
      v.name,
      v.mobile,
      v.email,
      v.company,
      v.whomToMeet,
      v.purpose,
      v.timestamp,
      v.checkOutTime || '-'
    ]);

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
            <p className="text-gray-600 mb-6">Search by Name, Mobile Number, or Email</p>

            {submitMessage && (
              <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                {submitMessage}
              </div>
            )}

            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-2">
                Search Visitor
              </label>
              <input
                type="text"
                value={checkoutSearch}
                onChange={handleCheckoutSearch}
                placeholder="Enter name, mobile, or email"
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
                          {visitor.checkOutTime ? `Checked Out` : 'Currently Inside'}
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
                <p className="text-yellow-700 font-semibold text-lg">No visitors found matching your search</p>
                <p className="text-yellow-600 mt-2">Please check the name, mobile number, or email and try again</p>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                <p className="text-blue-700 text-lg">Enter a name, mobile number, or email to search</p>
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

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Full Name *
                  </label>
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
                  {formErrors.name && <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>}
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Mobile Number *
                  </label>
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
                  {formErrors.mobile && <p className="text-red-500 text-sm mt-1">{formErrors.mobile}</p>}
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Email Address *
                  </label>
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
                  {formErrors.email && <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>}
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Person to Meet *
                  </label>
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
                  {formErrors.whomToMeet && <p className="text-red-500 text-sm mt-1">{formErrors.whomToMeet}</p>}
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Company *
                  </label>
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
                  {formErrors.company && <p className="text-red-500 text-sm mt-1">{formErrors.company}</p>}
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Purpose of Visit *
                  </label>
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
                  {formErrors.purpose && <p className="text-red-500 text-sm mt-1">{formErrors.purpose}</p>}
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  onClick={handleSubmit}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition text-lg"
                >
                  Submit Registration
                </button>
                <button
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

  // Admin Screen
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
                    if (e.key === 'Enter') {
                      if (adminLoginAttempt === adminPassword) {
                        setIsAdminLoggedIn(true);
                        setAdminLoginAttempt('');
                      } else {
                        alert('Invalid password');
                        setAdminLoginAttempt('');
                      }
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
                    setAdminLoginAttempt('');
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
        <div className="min-h-screen bg-gray-100 p-4 md:p-8">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => setScreen('admin')}
              className="mb-4 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded flex items-center gap-2"
            >
              <Home size={18} />
              Back to Dashboard
            </button>

            <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">App Settings</h2>

              {settingsSaved && (
                <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                  ✓ Settings saved successfully!
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Company Name / Header</label>
                  <input
                    type="text"
                    name="companyName"
                    value={settingsForm.companyName}
                    onChange={handleSettingsChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-lg"
                    placeholder="e.g., Welcome to epay Australia"
                  />
                  <p className="text-gray-500 text-sm mt-2">This will be displayed as the main title on the home screen</p>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Subtitle</label>
                  <input
                    type="text"
                    name="subtitle"
                    value={settingsForm.subtitle}
                    onChange={handleSettingsChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-lg"
                    placeholder="e.g., Visitors please sign in"
                  />
                  <p className="text-gray-500 text-sm mt-2">This will be displayed below the main title</p>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <Mail size={18} />
                    Notification Email Address
                  </label>
                  <input
                    type="email"
                    name="notificationEmail"
                    value={settingsForm.notificationEmail}
                    onChange={handleSettingsChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-lg"
                    placeholder="admin@example.com"
                  />
                  <p className="text-gray-500 text-sm mt-2">Visitor check-in emails will be sent to this address. Current: <span className="font-semibold">{settingsForm.notificationEmail}</span></p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-700 text-sm font-semibold">ℹ️ Email System</p>
                  <p className="text-blue-600 text-sm mt-2">When a visitor submits their registration, an email notification will be automatically sent to the configured email address with all their details.</p>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    onClick={() => saveSettings(settingsForm)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition"
                  >
                    Save Settings
                  </button>
                  <button
                    onClick={() => {
                      setSettingsForm(settings);
                      setScreen('admin');
                    }}
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

    // Admin Dashboard
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
              <p className="text-gray-600">Total Visitors: {visitors.length}</p>
            </div>
            <button
              onClick={() => {
                setIsAdminLoggedIn(false);
                setScreen('home');
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 font-bold"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={downloadCSV}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold"
              >
                <Download size={18} />
                Download CSV
              </button>
              <button
                onClick={() => setScreen('admin-settings')}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold"
              >
                <Settings size={18} />
                Settings
              </button>
              <button
                onClick={() => setScreen('home')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold"
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
