// src/pages/SettingsPage.jsx - NEW FILE
import { useState, useEffect } from "react";
import { 
  Settings as SettingsIcon, 
  Save, 
  DollarSign, 
  Clock, 
  User, 
  CheckCircle 
} from "lucide-react";
import { useToast } from "../../contexts/ToastContext";
import { 
  getSettings, 
  updateSettings, 
  updateLaborRateForJobType, 
  updateDefaultRevenueForJobType,
  updateTechnicianPaymentDefaults 
} from "../../api/settings";
import { formatCurrency } from "../../utils/format"

const SettingsPage = () => {
  const { addToast } = useToast();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [defaultHourlyRate, setDefaultHourlyRate] = useState(0);
  const [jobTypeRates, setJobTypeRates] = useState([]);
  const [defaultRevenue, setDefaultRevenue] = useState([]);
  const [technicianPayment, setTechnicianPayment] = useState({
    defaultCalculationType: "hourly",
    defaultFixedAmount: 0,
    defaultPercentage: 0,
  });
  const [generalSettings, setGeneralSettings] = useState({
    allowNegativeProfit: false,
    requireCostApproval: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await getSettings();
      const settingsData = data.settings;
      setSettings(settingsData);
      
      // Initialize form states
      if (settingsData) {
        setDefaultHourlyRate(settingsData.laborRates?.defaultHourlyRate || 0);
        setJobTypeRates(settingsData.laborRates?.ratesByJobType || []);
        setDefaultRevenue(settingsData.defaultRevenue || []);
        setTechnicianPayment(settingsData.technicianPayment || {
          defaultCalculationType: "hourly",
          defaultFixedAmount: 0,
          defaultPercentage: 0,
        });
        setGeneralSettings({
          allowNegativeProfit: settingsData.allowNegativeProfit || false,
          requireCostApproval: settingsData.requireCostApproval !== false,
        });
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error("Failed to load settings:", error);
      addToast({ message: "Failed to load settings", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      const updatedSettings = {
        laborRates: {
          defaultHourlyRate,
          ratesByJobType: jobTypeRates,
        },
        defaultRevenue,
        technicianPayment,
        ...generalSettings,
      };
      await updateSettings(updatedSettings);
      addToast({ message: "Settings saved successfully", type: 'success' });
      await loadSettings();
    } catch (error) {
      if (import.meta.env.DEV) console.error("Failed to save settings:", error);
      addToast({ message: "Failed to save settings", type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateJobTypeRate = (jobType, hourlyRate) => {
    setJobTypeRates(prev => {
      const existing = prev.find(r => r.jobType === jobType);
      if (existing) {
        return prev.map(r => r.jobType === jobType ? { ...r, hourlyRate } : r);
      } else {
        return [...prev, { jobType, hourlyRate }];
      }
    });
  };

  const handleUpdateDefaultRevenue = (jobType, amount) => {
    setDefaultRevenue(prev => {
      const existing = prev.find(r => r.jobType === jobType);
      if (existing) {
        return prev.map(r => r.jobType === jobType ? { ...r, amount } : r);
      } else {
        return [...prev, { jobType, amount }];
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin h-12 w-12 rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  const jobTypes = ['installation', 'repair', 'maintenance', 'inspection'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <SettingsIcon className="w-6 h-6" />
            System Settings
          </h2>
          <p className="text-gray-600 mt-1">
            Configure labor rates, revenue defaults, and technician payments
          </p>
        </div>
        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          <Save className="w-5 h-5" />
          {saving ? "Saving..." : "Save All Settings"}
        </button>
      </div>

      {/* Labor Rates Section */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Labor Rates
        </h3>
        
        {/* Default Hourly Rate */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Default Hourly Rate (used if no job type rate specified)
          </label>
          <div className="flex items-center gap-3">
            <span className="text-gray-500">₱</span>
            <input
              type="number"
              value={defaultHourlyRate}
              onChange={(e) => setDefaultHourlyRate(parseFloat(e.target.value) || 0)}
              min="0"
              step="0.01"
              className="border rounded-lg p-2.5 w-48"
            />
            <span className="text-sm text-gray-500">per hour</span>
          </div>
        </div>

        {/* Job Type Specific Rates */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Job Type Specific Rates</h4>
          <div className="space-y-4">
            {jobTypes.map((jobType) => {
              const rate = jobTypeRates.find(r => r.jobType === jobType);
              return (
                <div key={jobType} className="flex items-center gap-4">
                  <label className="w-32 text-sm font-medium text-gray-700 capitalize">
                    {jobType.replace('_', ' ')}
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">₱</span>
                    <input
                      type="number"
                      value={rate?.hourlyRate || ""}
                      onChange={(e) => handleUpdateJobTypeRate(
                        jobType, 
                        parseFloat(e.target.value) || 0
                      )}
                      min="0"
                      step="0.01"
                      className="border rounded-lg p-2.5 w-48"
                      placeholder="Leave empty to use default"
                    />
                    <span className="text-sm text-gray-500">per hour</span>
                  </div>
                  {rate?.hourlyRate ? (
                    <span className="text-sm text-green-600">
                      ✓ Custom rate set
                    </span>
                  ) : (
                    <span className="text-sm text-gray-500">
                      Using default: ₱{defaultHourlyRate}/hour
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Default Revenue Section */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Default Revenue by Job Type
        </h3>
        
        <div className="space-y-4">
          {jobTypes.map((jobType) => {
            const revenue = defaultRevenue.find(r => r.jobType === jobType);
            return (
              <div key={jobType} className="flex items-center gap-4">
                <label className="w-32 text-sm font-medium text-gray-700 capitalize">
                  {jobType.replace('_', ' ')}
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">₱</span>
                  <input
                    type="number"
                    value={revenue?.amount || ""}
                    onChange={(e) => handleUpdateDefaultRevenue(
                      jobType, 
                      parseFloat(e.target.value) || 0
                    )}
                    min="0"
                    step="0.01"
                    className="border rounded-lg p-2.5 w-48"
                    placeholder="Default revenue"
                  />
                </div>
                {revenue?.amount ? (
                  <span className="text-sm text-green-600">
                    ✓ Default set: {formatCurrency(revenue.amount)}
                  </span>
                    ) : (
                  <span className="text-sm text-gray-500">
                    No default revenue set
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Technician Payment Settings */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <User className="w-5 h-5" />
          Technician Payment Settings
        </h3>
        
        <div className="space-y-6">
          {/* Calculation Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Calculation Type
            </label>
            <select
              value={technicianPayment.defaultCalculationType}
              onChange={(e) => setTechnicianPayment({
                ...technicianPayment,
                defaultCalculationType: e.target.value
              })}
              className="border rounded-lg p-2.5 w-64"
            >
              <option value="hourly">Hourly Rate</option>
              <option value="fixed">Fixed Amount</option>
              <option value="percentage_revenue">Percentage of Revenue</option>
              <option value="percentage_profit">Percentage of Profit</option>
            </select>
          </div>

          {/* Fixed Amount */}
          {technicianPayment.defaultCalculationType === 'fixed' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fixed Amount per Job
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">₱</span>
                <input
                  type="number"
                  value={technicianPayment.defaultFixedAmount || 0}
                  onChange={(e) => setTechnicianPayment({
                    ...technicianPayment,
                    defaultFixedAmount: parseFloat(e.target.value) || 0
                  })}
                  min="0"
                  step="0.01"
                  className="border rounded-lg p-2.5 w-48"
                />
              </div>
            </div>
          )}

          {/* Percentage */}
          {(technicianPayment.defaultCalculationType === 'percentage_revenue' || 
            technicianPayment.defaultCalculationType === 'percentage_profit') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Percentage (%)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={technicianPayment.defaultPercentage || 0}
                  onChange={(e) => setTechnicianPayment({
                    ...technicianPayment,
                    defaultPercentage: parseFloat(e.target.value) || 0
                  })}
                  min="0"
                  max="100"
                  step="0.1"
                  className="border rounded-lg p-2.5 w-48"
                />
                <span className="text-gray-500">%</span>
                <span className="text-sm text-gray-500 ml-2">
                  of {technicianPayment.defaultCalculationType === 'percentage_revenue' ? 'revenue' : 'profit'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* General Settings */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          General Settings
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Allow Negative Profit
              </label>
              <p className="text-sm text-gray-500">
                Allow jobs to be approved even if profit is negative
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={generalSettings.allowNegativeProfit}
                onChange={(e) => setGeneralSettings({
                  ...generalSettings,
                  allowNegativeProfit: e.target.checked
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer 
                peer-checked:after:translate-x-full peer-checked:after:border-white 
                after:content-[''] after:absolute after:top-0.5 after:left-0.5
                after:bg-white after:border-gray-300 after:border after:rounded-full 
                after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600">
              </div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Require Cost Approval
              </label>
              <p className="text-sm text-gray-500">
                Require admin approval before marking job as completed
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={generalSettings.requireCostApproval}
                onChange={(e) => setGeneralSettings({
                  ...generalSettings,
                  requireCostApproval: e.target.checked
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer 
                peer-checked:after:translate-x-full peer-checked:after:border-white 
                after:content-[''] after:absolute after:top-0.5 after:left-0.5 
                after:bg-white after:border-gray-300 after:border after:rounded-full 
                after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600">
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;