'use client';
import PortifyHeader from "@/src/ui/components/PortifyHeader";
import { useState } from "react";
import { AGE_GROUPS, QUESTIONS, BENEFITS } from "@/src/data/dikaiousaiData";

export default function DikaiousaiPage() {
  const [step, setStep] = useState('age'); // age | questions | results
  const [ageGroup, setAgeGroup] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);

  const questions = ageGroup ? QUESTIONS[ageGroup] : [];

  const handleAge = (id) => {
    setAgeGroup(id);
    setStep('questions');
    setCurrentQ(0);
    setAnswers({});
  };

  const handleAnswer = (yes) => {
    const q = questions[currentQ];
    const newAnswers = { ...answers, [q.id]: yes };
    setAnswers(newAnswers);

    if (currentQ + 1 < questions.length) {
      setCurrentQ(currentQ + 1);
    } else {
      setStep('results');
    }
  };

  const getMatches = () => {
    return BENEFITS.filter(b => {
      if (!b.groups.includes(ageGroup)) return false;
      return Object.entries(b.rules).every(([key, val]) => answers[key] === val);
    });
  };

  const restart = () => {
    setStep('age');
    setAgeGroup(null);
    setAnswers({});
    setCurrentQ(0);
  };

  return (
    <main className="min-h-screen font-sans" style={{ background: '#e8e8e8' }}>
      <div className="mx-auto bg-white" style={{ maxWidth: 1200 }}>
        <PortifyHeader serviceId="dikaiousai" />

        <div className="px-8 py-12 flex flex-col items-center" style={{ minHeight: 500 }}>

          {/* STEP 1: Επιλογή ηλικίας */}
          {step === 'age' && (
            <div className="w-full max-w-lg">
              <h1 className="text-3xl font-black text-gray-900 mb-2 text-center">
                Τι δικαιούσαι;
              </h1>
              <p className="text-sm text-gray-400 text-center mb-10">
                Απάντησε σε 3 ερωτήσεις και μάθε τι σου ανήκει.
              </p>
              <div className="flex flex-col gap-4">
                {AGE_GROUPS.map(g => (
                  <button key={g.id} type="button" onClick={() => handleAge(g.id)}
                    className="flex items-center gap-5 p-5 rounded-2xl border-2 border-gray-200 hover:border-[#0D5EAF] hover:bg-[#f0f6ff] transition-all cursor-pointer bg-white text-left">
                    <span style={{ fontSize: 36 }}>{g.emoji}</span>
                    <div>
                      <div className="font-black text-gray-900 text-lg">{g.label}</div>
                      <div className="text-xs text-gray-400">{g.sub}</div>
                    </div>
                    <span className="ml-auto text-[#0D5EAF] font-bold">→</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Ερωτήσεις */}
          {step === 'questions' && (
            <div className="w-full max-w-lg">
              <div className="text-xs text-gray-400 text-center mb-6">
                Ερώτηση {currentQ + 1} από {questions.length}
              </div>
              <div className="bg-white rounded-2xl border-2 border-[#0D5EAF] p-8 text-center shadow-sm">
                <p className="text-xl font-bold text-gray-900 mb-8">
                  {questions[currentQ]?.text}
                </p>
                <div className="flex gap-4 justify-center">
                  <button type="button" onClick={() => handleAnswer(false)}
                    className="flex-1 py-4 rounded-xl border-2 border-gray-200 text-gray-600 font-bold text-lg hover:border-red-300 hover:bg-red-50 transition-all cursor-pointer bg-white">
                    Όχι
                  </button>
                  <button type="button" onClick={() => handleAnswer(true)}
                    className="flex-1 py-4 rounded-xl border-none text-white font-bold text-lg hover:bg-[#0a4d9a] transition-all cursor-pointer"
                    style={{ background: '#0D5EAF' }}>
                    Ναι
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Αποτελέσματα */}
          {step === 'results' && (
            <div className="w-full max-w-lg">
              {getMatches().length > 0 ? (
                <>
                  <div className="text-center mb-8">
                    <div style={{ fontSize: 48 }}>🎉</div>
                    <h2 className="text-2xl font-black text-gray-900 mt-2">
                      Βρήκαμε {getMatches().length} παροχές για σένα!
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">
                      Τα αποτελέσματα βασίζονται στις απαντήσεις σου.
                    </p>
                  </div>
                  <div className="flex flex-col gap-4">
                    {getMatches().map(b => (
                      <div key={b.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                        <div className="flex items-start justify-between mb-2">
                          <div className="font-black text-gray-900">{b.title}</div>
                          <div className="text-sm font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                            {b.amount}
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mb-4">{b.desc}</p>
                        <button type="button"
                          onClick={() => window.open(b.url, '_blank', 'noopener,noreferrer')}
                          className="w-full py-3 rounded-xl text-white font-bold text-sm border-none cursor-pointer hover:bg-[#0a4d9a] transition-colors"
                          style={{ background: '#0D5EAF' }}>
                          Κάνε αίτηση στο Gov.gr →
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <div style={{ fontSize: 48 }}>🤷</div>
                  <h2 className="text-xl font-black text-gray-900 mt-2 mb-2">
                    Δεν βρέθηκαν παροχές
                  </h2>
                  <p className="text-sm text-gray-400">
                    Με βάση τις απαντήσεις σου, δεν βρήκαμε επιδόματα που να ταιριάζουν αυτή τη στιγμή.
                  </p>
                </div>
              )}

              <button type="button" onClick={restart}
                className="mt-6 w-full py-3 rounded-xl border-2 border-gray-200 text-gray-500 font-semibold text-sm cursor-pointer bg-white hover:border-gray-300 transition-colors">
                ← Ξεκίνα ξανά
              </button>

              <p className="text-xs text-gray-300 text-center mt-4">
                Η τελική έγκριση γίνεται με κωδικούς Taxisnet στην επίσημη πλατφόρμα.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-8 py-5" style={{ background: '#111' }}>
          <span className="text-xs font-bold tracking-widest" style={{ color: '#ffffff40' }}>PORTIFY.GR</span>
          <span className="font-black tracking-tight" style={{ fontSize: 16, color: '#fff' }}>
            Faster than <span style={{ color: '#f5c842' }}>search.</span>
          </span>
        </div>
      </div>
    </main>
  );
}