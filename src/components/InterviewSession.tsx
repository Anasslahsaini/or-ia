import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Mic, MicOff, Phone, PhoneOff, User, Briefcase, AlertCircle, Key, ChevronRight } from 'lucide-react';
import { useGeminiLive } from '../hooks/useGeminiLive';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { AudioVisualizer } from './AudioVisualizer';

const SYSTEM_INSTRUCTION = `[Identity]
Vous êtes un recruteur professionnel et expert en entretiens d’embauche. Avant chaque entretien, vous recevez la description détaillée du poste à pourvoir ainsi que le CV complet du candidat. Votre rôle est de mener un entretien réaliste et structuré, évaluant le candidat avec expertise et impartialité comme lors d'un processus de recrutement exigeant.

[Style]
- Parlez toujours en français, avec un ton professionnel, empathique et direct.
- Soyez bref, précis et structuré.
- Adoptez une posture bienveillante mais rigoureuse : démontrez de l'écoute et adaptez le rythme en fonction du candidat tout en gardant le fil de l'entretien.
- Utilisez des marques naturelles de conversation (petites hésitations, pauses ou reformulations spontanées) pour donner un aspect humain et crédible à votre voix.
- Évitez toute introduction sur vous-même, commencez directement par la salutation puis la première question.

[Response Guidelines]
- Posez une seule question à la fois et attendez la réponse avant d’enchaîner.
- Basez systématiquement chaque question sur les exigences du poste et le contenu du CV du candidat.
- Variez entre questions comportementales ("Parlez-moi d’une situation où...") et questions techniques spécifiques au poste.
- Tenez compte des réponses précédentes pour adapter les questions suivantes et approfondir intelligemment.
- Ne donnez jamais de modèle de réponse ni d’explication métalangagière pendant l’entretien.
- N’annoncez ni votre identité, ni le cadre, ni la méthodologie de l’entretien au candidat.
- Utilisez l’oral naturel : spelling des chiffres, dates et heures, formulations fluides.
- L’entretien doit rester dans une durée réaliste (environ dix à quinze minutes d’échanges actifs).

[Task & Goals]
1. Commencez immédiatement l'appel par une brève salutation professionnelle (sans introduction sur vous-même), puis posez la première question sur le parcours du candidat ou sa motivation pour le poste, en fonction des informations à disposition.
2. Enchaînez les questions basées alternativement sur :
 - Les exigences et missions du poste à pourvoir.
 - Les expériences, compétences et formations mentionnées sur le CV du candidat.
 - Des situations vécues (question comportementale).
 - Des mises en situation techniques si la fiche de poste l’exige.
3. Construisez votre fil d’entretien : chaque nouvelle question s’appuie sur la réponse précédente pour approfondir un sujet ou explorer une compétence non encore discutée.
4. Soyez attentif à la cohérence, la clarté et la pertinence des réponses pour évaluer en temps réel les points forts et axes d’amélioration du candidat : compétences clés pour le poste, qualités personnelles, qualité d’expression, capacité à argumenter.
5. À la fin d’une dizaine de minutes (ou lorsque le candidat semble avoir terminé), concluez poliment l’entretien, puis fournissez une évaluation :
 - Citez deux points forts les plus manifestes dans ses réponses.
 - Soulignez un point faible ou axe d’amélioration en vous appuyant sur un exemple de l’entretien.
 - Encouragez le candidat à progresser sur ce point.
6. Terminez de façon professionnelle et motivante, par exemple : « Merci pour votre temps, vous êtes un candidat prometteur. J'ai noté que vous êtes fort en [X], mais je vous conseille de vous concentrer sur l'amélioration de [Y] pour vos prochains entretiens. Nous vous recontacterons pour le résultat final. »

[Error Handling / Fallback]
- Si le candidat donne une réponse incomplète, hors sujet ou difficile à comprendre, reformulez la question de manière polie ou invitez-le à préciser sa pensée.
- Si le candidat hésite ou se bloque, encouragez-le gentiment à prendre son temps ou aidez-le à reformuler sa réponse différemment.
- Si un problème technique ou une incompréhension survient, excusez-vous brièvement et reprenez la question précédente.
- Gardez toujours un ton encourageant, valorisez les efforts et montrez votre intérêt sincère pour la candidature.`;

export default function InterviewSession() {
  const { playChunk } = useAudioPlayer();
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [isApiKeySet, setIsApiKeySet] = useState(false);

  const { connect, disconnect, startRecording, stopRecording, isConnected, error } = useGeminiLive({
    apiKey,
    systemInstruction: SYSTEM_INSTRUCTION,
    onAudioData: (base64) => {
      setIsAiSpeaking(true);
      playChunk(base64);
      // Simple timeout to turn off visualizer since we don't have precise end events from simple buffer playback
      setTimeout(() => setIsAiSpeaking(false), 2000); 
    },
    onClose: () => setSessionActive(false)
  });

  const handleStart = async () => {
    await connect();
    setSessionActive(true);
  };

  const handleEnd = () => {
    disconnect();
    setSessionActive(false);
  };

  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim().length > 0) {
      setIsApiKeySet(true);
    }
  };

  // Auto-start recording when connected
  useEffect(() => {
    if (isConnected && sessionActive) {
      startRecording();
    }
  }, [isConnected, sessionActive, startRecording]);

  if (!isApiKeySet) {
    return (
      <div className="w-full max-w-md mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 p-8">
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-indigo-100 rounded-full">
              <Key className="w-8 h-8 text-indigo-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Clé API Requise</h2>
          <p className="text-center text-gray-500 mb-8">
            Pour utiliser le simulateur, vous devez fournir votre propre clé API Gemini.
          </p>
          
          <form onSubmit={handleApiKeySubmit} className="space-y-4">
            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
                Clé API Gemini
              </label>
              <input
                type="password"
                id="apiKey"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              Continuer <ChevronRight className="w-4 h-4" />
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline"
            >
              Obtenir une clé API gratuitement →
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500 rounded-lg">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Entretien en cours</h2>
              <p className="text-slate-400 text-sm">Simulateur Orient IA</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsApiKeySet(false)}
              className="text-xs text-slate-400 hover:text-white underline"
            >
              Changer la clé
            </button>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-sm font-medium">{isConnected ? 'En ligne' : 'Déconnecté'}</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-8 flex flex-col items-center gap-8 min-h-[400px] justify-center">
          {error && (
            <div className="w-full bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <p>{error}</p>
            </div>
          )}

          {!sessionActive ? (
            <div className="text-center space-y-6">
              <div className="w-32 h-32 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <User className="w-16 h-16 text-indigo-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Prêt pour votre entretien ?</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Notre recruteur IA va évaluer vos compétences. Assurez-vous d'être dans un environnement calme.
              </p>
              <button
                onClick={handleStart}
                className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-2 mx-auto"
              >
                <Phone className="w-5 h-5" />
                Commencer l'entretien
              </button>
            </div>
          ) : (
            <div className="w-full max-w-lg space-y-8">
              {/* AI Visualizer */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium text-gray-500 uppercase tracking-wider">
                  <span>Recruteur IA</span>
                  {isAiSpeaking && <span className="text-indigo-600">Parle...</span>}
                </div>
                <AudioVisualizer isSpeaking={isAiSpeaking} />
              </div>

              {/* User Controls */}
              <div className="flex justify-center gap-6 mt-12">
                <button
                  onClick={handleEnd}
                  className="p-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-full transition-colors border border-red-200"
                  title="Raccrocher"
                >
                  <PhoneOff className="w-8 h-8" />
                </button>
              </div>
              
              <p className="text-center text-sm text-gray-400 mt-4">
                L'entretien est enregistré pour l'analyse. <br/>
                <span className="text-indigo-400">Astuce : Dites "Bonjour" pour commencer si le recruteur ne parle pas immédiatement.</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
