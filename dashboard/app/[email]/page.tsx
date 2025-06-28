"use client";

import { useEffect, useState } from "react";
import { db } from "../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";

interface IntakeForm {
  fullName: string;
  email: string;
  age: string;
  weight: string;
  height: string;
  goals: string;
  timestamp: {
    toDate: () => Date;
  };
}

export default function ClientOverview() {
  const params = useParams();
  const router = useRouter();
  const [client, setClient] = useState<IntakeForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClient = async () => {
      if (!params?.email) return;

      try {
        const decodedEmail = decodeURIComponent(params.email as string);
        const docRef = doc(db, "intakeForms", decodedEmail);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setClient({ ...docSnap.data() } as IntakeForm);
        } else {
          setError("Client not found");
        }
      } catch (err) {
        setError("Failed to fetch client data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [params?.email]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!client) return <div className="p-6">No client data found</div>;

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h1 className="text-xl md:text-2xl font-bold">Client Overview</h1>
        <Link href="/" className="text-blue-600 hover:text-blue-800">
          Back to Dashboard
        </Link>
      </div>

      <div className="grid gap-4 md:gap-6">
        {/* Quick Overview Card */}
        <div className="bg-white p-4 md:p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">{client.fullName}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">Age: {client.age}</p>
              <p className="text-gray-600">Weight: {client.weight}</p>
              <p className="text-gray-600">Height: {client.height}</p>
            </div>
            <div>
              <p className="text-gray-600">Goals:</p>
              <p className="text-gray-700">{client.goals}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <button
            onClick={() => router.push(`/${params.email}/details`)}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 w-full"
          >
            View Full Details
          </button>
          <button
            onClick={() => router.push(`/${params.email}/nutrition`)}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 w-full"
          >
            Nutrition
          </button>
          <button
            onClick={() => router.push(`/${params.email}/report`)}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 w-full"
          >
            Reports
          </button>
          <button
            onClick={() => router.push(`/${params.email}/workout`)}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 w-full"
          >
            Workout
          </button>
          <button
            onClick={() =>
              router.push(`/${params.email}/workout/edit-template`)
            }
            className="bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600 w-full"
          >
            Edit Workout Template
          </button>
          <button
            onClick={() =>
              router.push(
                `/slack/dms?email=${encodeURIComponent(client.email)}`
              )
            }
            className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 w-full"
          >
            Contact via Slack
          </button>
        </div>
      </div>
    </div>
  );
}
