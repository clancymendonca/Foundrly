import Navbar from '@/components/layout/Navbar'
import MobileBottomNav from '@/components/layout/MobileBottomNav'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import NotificationPermissionPrompt from '@/components/notifications/NotificationPermissionPrompt'

export default function Layout({children}:Readonly<{children:React.ReactNode}>) { 
    return (
       <ThemeProvider>
         <main className='font-work-sans'>
          <Navbar />
          <NotificationPermissionPrompt />
          <div className="pt-16 pb-20 sm:pb-0">
            {children}
          </div>
          <MobileBottomNav />
         </main>
       </ThemeProvider>
    )
}
