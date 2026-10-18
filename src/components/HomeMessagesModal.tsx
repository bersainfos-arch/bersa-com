import { useState } from "react";
import {
  Users,
  MessageSquare,
  Bell,
  Send,
  Mic,
  Image as ImageIcon,
  Video,
  UserCheck,
  UserPlus,
  CheckCircle2,
  X,
  Heart,
  BookOpen,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface HomeMessagesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: "network" | "chat" | "notifications";
}

export function HomeMessagesModal({ open, onOpenChange, initialTab = "chat" }: HomeMessagesModalProps) {
  const [activeTab, setActiveTab] = useState<"network" | "chat" | "notifications">(initialTab);

  // 1. État Mon Réseau (Mes connaissances & Suggestions)
  const [connections, setConnections] = useState([
    { id: "1", name: "Prof. Jean-Marc Kabila", role: "Directeur de recherche en Droit", online: true },
    { id: "2", name: "Dr. Marie-Claire Lumumba", role: "Chercheuse en Économie Appliquée", online: false },
    { id: "3", name: "Alain Mutombo", role: "Doctorant en Informatique & IA", online: true },
  ]);

  const [suggestions, setSuggestions] = useState([
    { id: "s1", name: "Dr. Esther Tshisekedi", field: "Santé publique & Épidémiologie" },
    { id: "s2", name: "David Ilunga", field: "Sciences agronomiques & Développement" },
    { id: "s3", name: "Grace Kabasele", field: "Génie civil & Environnement" },
  ]);

  // 2. État Messagerie (Style WhatsApp : texte, photo, vidéo, audio)
  const [messages, setMessages] = useState([
    { id: "m1", sender: "Prof. Jean-Marc Kabila", text: "Bonjour, avez-vous lu le nouveau chapitre sur la méthodologie ?", type: "text", time: "10:14", isMe: false },
    { id: "m2", sender: "Moi", text: "Oui Professeur, je viens de terminer l'analyse comparative.", type: "text", time: "10:16", isMe: true },
  ]);
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  // 3. État Notifications
  const [notifications, setNotifications] = useState([
    { id: "n1", text: "Alain Mutombo a aimé votre publication", icon: Heart, time: "Il y a 5 min", unread: true },
    { id: "n2", text: "Nouvel ouvrage disponible en Droit des affaires", icon: BookOpen, time: "Il y a 1h", unread: true },
    { id: "n3", text: "Dr. Esther a accepté votre demande de connexion", icon: UserCheck, time: "Il y a 2h", unread: false },
  ]);

  // Envoi de message
  const handleSendMessage = (type: "text" | "photo" | "video" | "audio" = "text", content?: string) => {
    const textToSend = content || inputText.trim();
    if (!textToSend && type === "text") return;

    setMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        sender: "Moi",
        text: type === "text" ? textToSend : `[Fichier ${type} envoyé : ${textToSend || "Média"}]`,
        type,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isMe: true,
      },
    ]);
    setInputText("");
    if (type !== "text") toast.success(`${type.toUpperCase()} joint à la conversation !`);
  };

  const handleConnect = (id: string, name: string) => {
    setSuggestions((prev) => prev.filter((s) => s.id !== id));
    toast.success(`Demande de connexion envoyée à ${name}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full p-0 overflow-hidden rounded-2xl bg-card border border-border shadow-2xl h-[85vh] flex flex-col">
        {/* En-tête des 3 onglets demandés */}
        <div className="p-2 border-b border-border bg-muted/40 grid grid-cols-3 gap-1">
          <button
            onClick={() => setActiveTab("network")}
            className={`py-2 px-1 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === "network" ? "bg-card text-primary shadow-xs" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span className="truncate">Mon Réseau</span>
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={`py-2 px-1 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === "chat" ? "bg-card text-primary shadow-xs" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span className="truncate">Messages</span>
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            className={`py-2 px-1 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === "notifications" ? "bg-card text-primary shadow-xs" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Bell className="h-3.5 w-3.5" />
            <span className="truncate">Notifications</span>
          </button>
        </div>

        {/* CONTENU ONGLET 1 : MON RÉSEAU */}
        {activeTab === "network" && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Sous-section 1 : Mes connaissances (acceptées) */}
            <div>
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <UserCheck className="h-4 w-4 text-emerald-500" />
                Mes connaissances ({connections.length})
              </h4>
              <div className="space-y-2">
                {connections.map((c) => (
                  <div key={c.id} className="p-2.5 bg-muted/40 rounded-xl border border-border flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-foreground">{c.name}</p>
                      <p className="text-[11px] text-muted-foreground">{c.role}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setActiveTab("chat")} className="h-7 text-xs">
                      Écrire
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Sous-section 2 : Suggestions "Pouvez-vous connaître" */}
            <div>
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <UserPlus className="h-4 w-4 text-primary" />
                Pouvez-vous connaître ?
              </h4>
              <div className="space-y-2">
                {suggestions.map((s) => (
                  <div key={s.id} className="p-2.5 bg-muted/40 rounded-xl border border-border flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-foreground">{s.name}</p>
                      <p className="text-[11px] text-muted-foreground">{s.field}</p>
                    </div>
                    <Button size="sm" onClick={() => handleConnect(s.id, s.name)} className="h-7 text-xs gap-1">
                      <UserPlus className="h-3 w-3" />
                      Connecter
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CONTENU ONGLET 2 : MESSAGES (STYLE WHATSAPP) */}
        {activeTab === "chat" && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Fil des messages avec bulles horodatées */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-muted/10">
              {messages.map((m) => (
                <div key={m.id} className={`flex flex-col ${m.isMe ? "items-end" : "items-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs shadow-xs ${
                      m.isMe ? "bg-primary text-primary-foreground rounded-br-none" : "bg-card border border-border text-foreground rounded-bl-none"
                    }`}
                  >
                    <p>{m.text}</p>
                    <span className={`text-[9px] block text-right mt-0.5 ${m.isMe ? "text-primary-foreground/75" : "text-muted-foreground"}`}>
                      {m.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Barre de saisie multi-médias (Texte, Photo, Vidéo, Audio WhatsApp) */}
            <div className="p-2 bg-card border-t border-border flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleSendMessage("photo", "Photo de recherche.jpg")}
                className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
                title="Joindre une photo"
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleSendMessage("video", "Explication.mp4")}
                className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
                title="Joindre une vidéo"
              >
                <Video className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsRecording(!isRecording);
                  if (!isRecording) {
                    toast.info("Enregistrement audio en cours...");
                  } else {
                    handleSendMessage("audio", "Note vocale (0:14)");
                  }
                }}
                className={`h-8 w-8 shrink-0 ${isRecording ? "text-rose-500 animate-pulse bg-rose-500/10" : "text-muted-foreground"}`}
                title="Note vocale"
              >
                <Mic className="h-4 w-4" />
              </Button>

              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage("text")}
                placeholder={isRecording ? "Enregistrement de la voix..." : "Écrire un message..."}
                className="h-8 text-xs bg-muted/40"
              />

              <Button size="icon" onClick={() => handleSendMessage("text")} className="h-8 w-8 shrink-0">
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* CONTENU ONGLET 3 : TOUTES LES NOTIFICATIONS */}
        {activeTab === "notifications" && (
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {notifications.map((n) => {
              const Icon = n.icon;
              return (
                <div
                  key={n.id}
                  className={`p-2.5 rounded-xl border flex items-center gap-3 transition-colors ${
                    n.unread ? "bg-primary/5 border-primary/20" : "bg-card border-border"
                  }`}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground">{n.text}</p>
                    <p className="text-[10px] text-muted-foreground">{n.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
     }
