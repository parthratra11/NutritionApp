"use client";

import { useEffect, useState } from "react";
import { db } from "../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { useRouter, useParams } from "next/navigation";

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
  const [userName, setUserName] = useState<string>("Aria Michele");
  
  // Generate days of the week with dates for the header
  const generateDateStrip = () => {
    const days = ["S", "M", "T", "W", "Th", "F", "S"];
    const today = new Date();
    const currentDay = today.getDay(); // 0 is Sunday

    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(today.getDate() - currentDay + i);
      dates.push({
        day: days[i],
        date: date.getDate(),
        isToday: i === currentDay,
      });
    }

    return dates;
  };

  const dateStrip = generateDateStrip();

  useEffect(() => {
    const fetchClientData = async () => {
      if (!params?.email) return;

      try {
        const decodedEmail = decodeURIComponent(params.email as string);
        const clientDocRef = doc(db, "intakeForms", decodedEmail);
        const clientDocSnap = await getDoc(clientDocRef);

        if (clientDocSnap.exists()) {
          const clientData = clientDocSnap.data() as IntakeForm;
          setClient(clientData);
          setUserName(clientData.fullName || "Aria Michele");
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

    fetchClientData();
  }, [params?.email]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07172C] text-white flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07172C] text-white">
      {/* Top Bar */}
      <div className="flex justify-between items-center px-6 pt-3 pb-2">
        {/* Left Icons */}
        <div className="flex items-center gap-6">
          <button className="text-white">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <div className="flex items-center bg-[#FFFFFF1A] backdrop-blur-xl rounded-full p-1 h-8 shadow-[-2px_6px_22.6px_-3px_#00000040]">
            <button className="w-8 h-6 flex items-center justify-center text-white">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            </button>
            <button className="w-8 h-6 flex items-center justify-center bg-[#CBD3DB] text-[#07172C] rounded-full">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </button>
            <button className="w-8 h-6 flex items-center justify-center text-white">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Week Day Selector */}
        <div className="flex items-center gap-2">
          {dateStrip.map((item, index) => (
            <div 
              key={index} 
              className={`flex flex-col items-center justify-center rounded-full w-8 h-12 ${
                item.isToday ? 'bg-[#DD3333] text-white shadow-[-2px_6px_22.6px_-3px_#00000040]' : 'bg-[#FFFFFF1A] backdrop-blur-xl text-gray-300 shadow-[-2px_6px_22.6px_-3px_#00000040]'
              }`}
            >
              <span className="text-xs leading-none">{item.day}</span>
              <span className="text-xs leading-none mt-1">{item.date}</span>
            </div>
          ))}
        </div>
        
        {/* Removed user profile from top bar as it's now in the right panel */}
        <div className="w-[500px]">
          {/* This space is intentionally left empty to maintain layout */}
        </div>
      </div>
      
      {/* Main Content with Right Panel */}
      <div className="px-6 pb-3 pr-[510px]">
        {/* Cards Grid */}
        <div className="grid grid-cols-12 gap-3 h-[calc(100vh-70px)] overflow-hidden">
          {/* Sleep Card */}
          <div 
            className="col-span-6 bg-[#FFFFFF1A] backdrop-blur-xl rounded-xl p-2.5 relative cursor-pointer shadow-[-2px_6px_22.6px_-3px_#00000040]"
            onClick={() => router.push(`/${params.email}/sleep`)}
          >
            <div className="flex items-center gap-1 font-semibold text-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
              Sleep
              <svg className="w-3 h-3 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            
            <div className="absolute top-2.5 right-2.5 text-[10px] text-gray-400">
              28 July
            </div>
            
            <div className="flex justify-between mt-1.5">
              {/* Sleep Hours - Left Side */}
              <div>
                <div className="flex items-end">
                  <span className="text-3xl leading-none font-semibold">6</span>
                  <span className="text-xs mb-1 ml-1">hr</span>
                  <span className="text-3xl leading-none font-semibold ml-1">42</span>
                  <span className="text-xs mb-1 ml-1">min</span>
                </div>
                <div className="text-[9px] text-gray-400 mt-1">
                  Sleep Hours
                </div>
              </div>
              
              {/* Sleep Quality - Right Side */}
              <div className="text-right">
                <div className="text-xl font-semibold">
                  Restful
                </div>
                <div className="text-[9px] text-gray-400">
                  Sleep Quality
                </div>
              </div>
            </div>
          </div>

          {/* Weight Card */}
          <div 
            className="col-span-6 bg-[#FFFFFF1A] backdrop-blur-xl rounded-xl p-2.5 relative cursor-pointer shadow-[-2px_6px_22.6px_-3px_#00000040]"
            onClick={() => router.push(`/${params.email}/weight`)}
          >
            <div className="flex items-center gap-1 font-semibold text-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2" />
              </svg>
              Weight
              <svg className="w-3 h-3 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            
            <div className="absolute top-2.5 right-2.5 text-[10px] text-gray-400">
              28 July
            </div>
            
            <div className="flex items-end mt-2">
              <span className="text-3xl leading-none font-semibold">74.2</span>
              <span className="text-xs mb-1 ml-1">Kg</span>
            </div>
          </div>

          {/* Nutrition Card */}
          <div 
            className="col-span-12 bg-[#FFFFFF1A] backdrop-blur-xl rounded-xl p-4 relative cursor-pointer shadow-[-2px_6px_22.6px_-3px_#00000040]"
            onClick={() => router.push(`/${params.email}/nutrition`)}
          >
            <div className="flex items-center gap-2 font-semibold text-base">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h8M12 18h8" />
              </svg>
              Nutrition
              <svg className="w-4 h-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            
            <div className="absolute top-4 right-4 text-sm text-gray-400">
              28 July
            </div>
            
            <div className="grid grid-cols-4 gap-4 mt-4">
              {/* Protein */}
              <div>
                <div className="text-4xl font-semibold mb-1">150<span className="text-base ml-1 font-normal text-gray-400">g</span></div>
                <div className="text-xs text-gray-400 mb-1">165g</div>
                <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-red-600" style={{ width: "91%" }}></div>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span>Protein</span>
                  <span className="text-gray-400">91%</span>
                </div>
              </div>
              
              {/* Fat */}
              <div>
                <div className="text-4xl font-semibold mb-1">80<span className="text-base ml-1 font-normal text-gray-400">g</span></div>
                <div className="text-xs text-gray-400 mb-1">73g</div>
                <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-red-600" style={{ width: "110%" }}></div>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span>Fat</span>
                  <span className="text-gray-400">110%</span>
                </div>
              </div>

              {/* Carbs */}
              <div>
                <div className="text-4xl font-semibold mb-1">195<span className="text-base ml-1 font-normal text-gray-400">g</span></div>
                <div className="text-xs text-gray-400 mb-1">220g</div>
                <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-red-600" style={{ width: "89%" }}></div>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span>Carbs</span>
                  <span className="text-gray-400">89%</span>
                </div>
              </div>

              {/* Calories */}
              <div>
                <div className="text-4xl font-semibold mb-1">2,150<span className="text-base ml-1 font-normal text-gray-400">Kcal</span></div>
                <div className="text-xs text-gray-400 mb-1">&nbsp;</div>
                <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-red-600" style={{ width: "98%" }}></div>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span>Calories</span>
                  <span className="text-gray-400">98%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Steps Card */}
          <div 
            className="col-span-6 bg-[#FFFFFF1A] backdrop-blur-xl rounded-xl p-3 relative cursor-pointer shadow-[-2px_6px_22.6px_-3px_#00000040]"
            onClick={() => router.push(`/${params.email}/steps`)}
          >
            <div className="flex items-center gap-1 font-semibold text-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              Steps
              <svg className="w-3 h-3 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            
            <div className="absolute top-3 right-3 text-[10px] text-gray-400">
              28 July
            </div>
            
            <div className="mt-2">
              <div className="text-3xl font-semibold">5,000</div>
              <div className="text-[10px] text-gray-400 mt-1">10,000 Steps</div>
            </div>
          </div>

          {/* Moods Card */}
          <div 
            className="col-span-6 bg-[#FFFFFF1A] backdrop-blur-xl rounded-xl p-3 relative cursor-pointer shadow-[-2px_6px_22.6px_-3px_#00000040]"
            onClick={() => router.push(`/${params.email}/moods`)}
          >
            <div className="flex items-center gap-1 font-semibold text-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Moods
              <svg className="w-3 h-3 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            
            <div className="absolute top-3 right-3 text-[10px] text-gray-400">
              28 July
            </div>
            
            <div className="flex items-center mt-2">
              <div className="w-12 h-12 rounded-lg bg-[#BFD8E9] flex items-center justify-center mr-4">
                <svg className="w-8 h-8 text-[#07172C]" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3-8a3 3 0 11-6 0h6z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <div className="text-xl font-semibold">Calm</div>
                <div className="text-[10px] text-gray-400">16:28pm</div>
              </div>
            </div>
          </div>

          {/* Exercises Card */}
          <div 
            className="col-span-12 bg-[#FFFFFF1A] backdrop-blur-xl rounded-xl p-3 relative cursor-pointer shadow-[-2px_6px_22.6px_-3px_#00000040]"
            onClick={() => router.push(`/${params.email}/workout`)}
          >
            <div className="flex items-center gap-1 font-semibold text-sm mb-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
              Exercises
              <svg className="w-3 h-3 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            
            <ul className="text-xs leading-tight space-y-0.5">
              <li>Barbell Hip Thrust</li>
              <li>Heels Elevated Zercher Squat</li>
              <li>Scrape Rack L-Seated Shoulder Press</li>
              <li>Seated DB Lateral Raise</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="fixed top-0 right-0 h-full w-[500px] bg-[#FFFFFF1A] border-l border-[#1F3247] pt-4 px-5 overflow-y-auto shadow-[-2px_6px_22.6px_-3px_#00000040]">
        {/* User Profile - Top of Panel */}
        <div className="mb-5">
          <div className="bg-[#FFFFFF1A] backdrop-blur-xl rounded-xl px-4 py-3.5 shadow-[-2px_6px_22.6px_-3px_#00000040]">
            <div className="flex items-center gap-3">
              <img 
                src="/User.png" 
                alt="Profile" 
                className="h-16 w-16 rounded-full object-cover ring-2 ring-[#0E1F34]"
              />
              <div className="flex flex-col">
                <div className="flex items-center text-lg font-semibold">
                  {userName}
                  <svg className="w-4 h-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex items-center text-xs text-gray-300 mt-1">
                  <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Sydney, Australia
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Status */}
        <div className="mb-5">
          <div className="text-sm font-medium mb-2">Payment Status</div>
          <div className="bg-[#FFFFFF1A] backdrop-blur-xl rounded-xl p-4 flex items-center justify-center shadow-[-2px_6px_22.6px_-3px_#00000040]">
            <span className="text-green-500 font-semibold text-xl">Paid</span>
          </div>
        </div>
        
        {/* Anthropometric Data */}
        <div className="mb-5">
          <div className="flex items-center gap-2 text-sm font-medium mb-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Anthropometric Data
          </div>
          
          <div className="bg-[#FFFFFF1A] backdrop-blur-xl rounded-xl p-4 flex justify-between shadow-[-2px_6px_22.6px_-3px_#00000040]">
            <div className="flex flex-col items-center flex-1">
              <div className="text-2xl font-semibold">57<span className="text-[10px] ml-0.5 font-normal">kg</span></div>
              <div className="text-xs text-gray-400">Weight</div>
            </div>
            <div className="flex flex-col items-center flex-1">
              <div className="text-2xl font-semibold">167<span className="text-[10px] ml-0.5 font-normal">cm</span></div>
              <div className="text-xs text-gray-400">Height</div>
            </div>
            <div className="flex flex-col items-center flex-1">
              <div className="text-2xl font-semibold">29</div>
              <div className="text-xs text-gray-400">Age</div>
            </div>
          </div>
        </div>
        
        {/* Body Metrics */}
        <div className="text-xs text-gray-400 mb-2">20 July</div>
        <div className="grid grid-cols-3 gap-2 mb-5">
          <div className="bg-[#FFFFFF1A] backdrop-blur-xl rounded-xl p-3 flex flex-col items-center shadow-[-2px_6px_22.6px_-3px_#00000040]">
            <div className="text-xl font-semibold">23<span className="text-[10px] ml-0.5 font-normal">%</span></div>
            <div className="text-xs text-gray-400">Body Fat</div>
          </div>
          <div className="bg-[#FFFFFF1A] backdrop-blur-xl rounded-xl p-3 flex flex-col items-center shadow-[-2px_6px_22.6px_-3px_#00000040]">
            <div className="text-xl font-semibold">96.5<span className="text-[10px] ml-0.5 font-normal">cm</span></div>
            <div className="text-xs text-gray-400 text-center">Hip Circumference</div>
          </div>
          <div className="bg-[#FFFFFF1A] backdrop-blur-xl rounded-xl p-3 flex flex-col items-center shadow-[-2px_6px_22.6px_-3px_#00000040]">
            <div className="text-xl font-semibold">71<span className="text-[10px] ml-0.5 font-normal">cm</span></div>
            <div className="text-xs text-gray-400 text-center">Waist Circumference</div>
          </div>
        </div>
        
        {/* Goals */}
        <div>
          <div className="flex items-center gap-2 text-sm font-medium mb-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Goals
          </div>
          
          <div className="bg-[#FFFFFF1A] backdrop-blur-xl rounded-xl p-4 shadow-[-2px_6px_22.6px_-3px_#00000040]">
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>I want to lose body fat and tone up.</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>I want to improve my stamina and endurance.</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>I want to create a consistent workout routine.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}