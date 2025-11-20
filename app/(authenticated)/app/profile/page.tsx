export const metadata = {
  title: "Profile - Miami.AI",
  description: "Manage your Miami.AI profile and settings",
  robots: "noindex, nofollow",
}

import ProfileClient from "./profile-client"

export default function ProfilePage() {
  return <ProfileClient />
}
