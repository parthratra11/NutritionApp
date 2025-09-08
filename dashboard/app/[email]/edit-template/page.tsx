"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navigation from "../../../components/shared/Navigation";
import { db } from "../../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

export default function EditTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const [userName, setUserName] = useState<string>("User");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClientName = async () => {
      if (!params?.email) return;
      try {
        const clientEmail = decodeURIComponent(params.email as string);
        const clientDocRef = doc(db, "intakeForms", clientEmail);
        const clientDocSnap = await getDoc(clientDocRef);
        if (clientDocSnap.exists()) {
          const clientData = clientDocSnap.data();
          setUserName(clientData.fullName || "User");
        }
      } catch (err) {
        console.error("Failed to fetch client name:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchClientName();
  }, [params?.email]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07172C] text-white">
        <Navigation
          title="Edit Template"
          subtitle="Edit workout template"
          email={decodeURIComponent(params.email as string)}
          userName={userName}
        />
        <div className="px-4 py-6 flex justify-center items-center h-64">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07172C] text-white">
      <Navigation
        title="Edit Template"
        subtitle="Edit workout template"
        email={decodeURIComponent(params.email as string)}
        userName={userName}
      />

      <div className="px-4 py-6">
        <div className="bg-[#142437] border border-[#22364F] rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Edit Workout Template</h2>
          <p className="text-gray-400">
            Template editing functionality coming soon...
          </p>
        </div>
      </div>
    </div>
  );
}
