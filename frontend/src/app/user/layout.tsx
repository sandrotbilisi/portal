"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { MeResponse } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  axios.defaults.withCredentials = true;

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/auth/me`);
        if (res.data?.data) {
          const info: MeResponse = res.data.data;
          // Allow users, admins, and systemAdmins to access user section
          if (info.role === 'user' || info.role === 'admin' || info.role === 'systemAdmin') {
            setAuthorized(true);
          } else {
            router.replace('/unauthorized');
            return;
          }
        } else {
          router.replace('/login');
          return;
        }
      } catch {
        router.replace('/login');
        return;
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block relative">
            <div className="w-16 h-16 border-4 border-gray-600 border-t-gray-400 rounded-full animate-spin"></div>
          </div>
          <p className="mt-4 text-gray-300 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return <>{children}</>;
}

