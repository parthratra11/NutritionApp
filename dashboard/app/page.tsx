"use client";

import { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import { collection, getDocs } from "@firebase/firestore";

interface IntakeForm {
  id: string;
  name: string;
  age: number;
  email: string;
  // Add other fields that match your intake form structure
}

export default function Home() {
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

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">
        Dashboard for Nutrition App
      </h1>
      <div className="grid gap-4">
        {intakeForms.map((form) => (
          <div key={form.id} className="border rounded-lg p-4 shadow">
            <h2 className="font-semibold">Name: {form.fullName}</h2>
            <p>Age: {form.age}</p>
            <p>Email: {form.email}</p>
            {/* Add more fields as needed */}
          </div>
        ))}
        {intakeForms.length === 0 && <p>No intake forms found.</p>}
      </div>
    </div>
  );
}
