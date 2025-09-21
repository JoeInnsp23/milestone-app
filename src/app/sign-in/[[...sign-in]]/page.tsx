import { SignIn } from '@clerk/nextjs';
import { BarChart3 } from 'lucide-react';

export default function SignInPage() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  return (
    <div className="min-h-screen dashboard-bg-gradient flex items-center justify-center p-4">
      <div className="relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 rounded-xl shadow-lg mb-4">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Project Hub
          </h1>
          <p className="text-muted-foreground mt-2">Sign in to access your dashboard</p>
        </div>

        <SignIn
          appearance={{
            elements: {
              rootBox: "mx-auto",
              footer: "hidden"  // Hide the "Don't have an account?" footer
            },
            layout: {
              socialButtonsPlacement: "bottom",
              socialButtonsVariant: "iconButton",
              showOptionalFields: false,
            }
          }}
          routing="path"
          path={`${basePath}/sign-in`}
        />

        <p className="text-center text-sm text-muted-foreground mt-8">
          For access, please contact your administrator
        </p>
      </div>
    </div>
  );
}