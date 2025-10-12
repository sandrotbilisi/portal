"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

interface MeResponse {
  username: string;
  role: "admin" | "user";
  name: string;
  lastname: string;
  personalNumber: string;
  branchId: string;
  branchName: string;
  branchLocation: string;
}

export default function RootPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  axios.defaults.withCredentials = true;

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/auth/me`);
        if (res.data?.data) {
          const info: MeResponse = res.data.data;
          // Redirect based on role
          if (info.role === 'admin') {
            router.replace('/admin');
          } else if (info.role === 'user') {
            router.replace('/user');
          } else {
            router.replace('/login');
          }
        } else {
          router.replace('/login');
        }
      } catch {
        router.replace('/login');
    } finally {
      setLoading(false);
    }
  };
    checkAuthAndRedirect();
  }, [router]);

        return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block relative mb-4">
                <div className="w-16 h-16 border-4 border-gray-600 border-t-gray-400 rounded-full animate-spin"></div>
              </div>
        <p className="text-gray-300 text-lg">Redirecting...</p>
            </div>
    </div>
  );
}
