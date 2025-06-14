"use client";

import { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import { collection, getDocs } from "@firebase/firestore";
import { useRouter } from "next/navigation";

interface IntakeForm {
  id: string;
  fullName: string;
  email: string;
  timestamp: {
    toDate: () => Date;
  };
}

export default function Home() {
  const router = useRouter();
  const [intakeForms, setIntakeForms] = useState<IntakeForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIntakeForms = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "intakeForms"));
        const forms = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as IntakeForm[];
        setIntakeForms(forms);
      } catch (err) {
        setError("Failed to fetch intake forms");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchIntakeForms();
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Client Dashboard</h1>
      <div className="grid gap-4">
        {intakeForms.map((form) => (
          <div
            key={form.email}
            className="border rounded-lg p-4 shadow hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => router.push(`/${encodeURIComponent(form.email)}`)} // Remove /details
          >
            <h2 className="font-semibold">Name: {form.fullName}</h2>
            <p className="text-gray-600">Email: {form.email}</p>
            <p className="text-sm text-gray-500 mt-2">
              Submitted: {form.timestamp?.toDate().toLocaleDateString()}
            </p>
          </div>
        ))}
        {intakeForms.length === 0 && (
          <p className="text-gray-500">No intake forms found.</p>
        )}
      </div>
    </div>
  );
}
