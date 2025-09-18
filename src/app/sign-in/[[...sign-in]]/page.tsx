import { SignIn } from '@clerk/nextjs';
import { BarChart3 } from 'lucide-react';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-100/20 via-transparent to-indigo-100/20" />

      <div className="relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg mb-4">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Milestone P&L Dashboard
          </h1>
          <p className="text-gray-600 mt-2">Sign in to access your dashboard</p>
        </div>

        <SignIn
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-white/95 backdrop-blur-md shadow-2xl border border-gray-100 rounded-xl",
              headerTitle: "text-2xl font-bold text-gray-900",
              headerSubtitle: "text-gray-600",
              socialButtonsBlockButton: "bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 transition-all duration-200",
              formButtonPrimary: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all duration-200",
              footerActionLink: "text-blue-600 hover:text-blue-700 transition-colors",
              identityPreviewText: "text-gray-700",
              identityPreviewEditButtonIcon: "text-gray-500",
              formFieldInput: "border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg",
              formFieldLabel: "text-gray-700 font-medium",
              dividerLine: "bg-gray-200",
              dividerText: "text-gray-500",
              formFieldError: "text-red-600",
              formFieldSuccessText: "text-green-600",
              alertText: "text-gray-700",
              footer: "hidden"  // Hide the "Don't have an account?" footer
            },
            layout: {
              socialButtonsPlacement: "bottom",
              socialButtonsVariant: "iconButton",
              showOptionalFields: false,
            },
            variables: {
              colorPrimary: "#2563eb",
              colorTextOnPrimaryBackground: "#ffffff",
              colorBackground: "#ffffff",
              colorText: "#1f2937",
              borderRadius: "0.5rem",
            }
          }}
          routing="path"
          path="/sign-in"
          signUpUrl={undefined}  // Disable sign-up link
        />

        <p className="text-center text-sm text-gray-500 mt-8">
          For access, please contact your administrator
        </p>
      </div>
    </div>
  );
}