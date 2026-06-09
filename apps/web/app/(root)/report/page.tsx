import { auth } from "@/auth";
import { redirect } from "next/navigation";
import UserSidebarWrapper from "@/components/layout/UserSidebarWrapper";
import ReportFeedbackButton from "@/components/reports/ReportFeedbackButton";

export default async function ReportPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen">
      <div className="flex-1">
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                🚨 Report a Problem
              </h1>
              <p className="text-gray-600 text-lg">
                Help us improve by reporting issues or bugs you encounter.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="mb-6">
                <ReportFeedbackButton 
                  label="Open Sentry Feedback Form"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-black text-white hover:bg-black/90"
                />
              </div>
              <form className="space-y-6">
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                    Issue Category
                  </label>
                  <select
                    id="category"
                    name="category"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    <option value="">Select a category</option>
                    <option value="bug">Bug Report</option>
                    <option value="feature">Feature Request</option>
                    <option value="ui">UI/UX Issue</option>
                    <option value="performance">Performance Problem</option>
                    <option value="security">Security Concern</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Issue Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    placeholder="Brief description of the issue"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Detailed Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={6}
                    placeholder="Please provide a detailed description of the issue, including steps to reproduce if applicable..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                
                <div>
                  <label htmlFor="severity" className="block text sm font-medium text-gray-700 mb-2">
                    Severity Level
                  </label>
                  <select
                    id="severity"
                    name="severity"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    <option value="">Select severity</option>
                    <option value="low">Low - Minor inconvenience</option>
                    <option value="medium">Medium - Affects functionality</option>
                    <option value="high">High - Major functionality broken</option>
                    <option value="critical">Critical - System unusable</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="browser" className="block text-sm font-medium text-gray-700 mb-2">
                    Browser & Device Info (Optional)
                  </label>
                  <input
                    type="text"
                    id="browser"
                    name="browser"
                    placeholder="e.g., Chrome 120.0.0.0 on Windows 11"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                
                <div className="flex items-center gap-4">
                  <button
                    type="submit"
                    className="flex-1 bg-primary text-white py-3 px-6 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                  >
                    Submit Report
                  </button>
                  <button
                    type="button"
                    onClick={() => window.history.back()}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
              
              <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">💡 Tips for a Better Report</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Be specific about what you were trying to do</li>
                  <li>• Include any error messages you saw</li>
                  <li>• Mention the steps that led to the issue</li>
                  <li>• Provide screenshots if possible</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      <UserSidebarWrapper 
        userId={session.user.id} 
        isOwnProfile={true} 
      />
    </div>
  );
}

