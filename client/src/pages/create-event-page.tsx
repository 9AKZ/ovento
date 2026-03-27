import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEventSchema } from "../../shared/schema";
import { z } from "zod";
import { useLocation } from "wouter";
import { useCreateEvent, useUploadEventImage } from "@/hooks/use-events";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Calendar as CalendarIcon, Upload, Sparkles, MapPin, Users } from "lucide-react";
import { useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { motion } from "framer-motion";

// Extend schema to handle array transformation and defaults
const formSchema = insertEventSchema.extend({
  tags: z.string(), // Input as comma separated string
  price: z.coerce.number(), // Input is string, coerce to number
  capacity: z.coerce.number(),
  startDatetime: z.string(), // datetime-local input returns string
  endDatetime: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateEventPage() {
  const [, setLocation] = useLocation();
  const createEventMutation = useCreateEvent();
  const uploadImageMutation = useUploadEventImage();
  const [imagePreview, setImagePreview] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      capacity: 100,
      price: 0,
      currency: "EUR",
      tags: "",
      status: "PUBLISHED",
      startDatetime: "",
      endDatetime: "",
    },
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (values: FormValues) => {
    // Transform data for API
    const apiData = {
      ...values,
      tags: values.tags.split(",").map(t => t.trim()).filter(Boolean),
      startDatetime: new Date(values.startDatetime).toISOString(), // Ensure ISO format
      endDatetime: values.endDatetime ? new Date(values.endDatetime).toISOString() : undefined,
    };

    createEventMutation.mutate(apiData as any, {
      onSuccess: (response: any) => {
        const eventId = response.event?.id;
        if (selectedFile && eventId) {
          uploadImageMutation.mutate({ id: eventId, file: selectedFile }, {
            onSuccess: () => setLocation("/"),
          });
        } else {
          setLocation("/");
        }
      },
    });
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10"
      >
        <div className="flex items-center gap-2 mb-3 text-primary">
          <Sparkles className="w-5 h-5" />
          <span className="text-sm font-semibold uppercase tracking-wider">Créer</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-display font-bold mb-2">
          Lancez votre Événement <span className="gradient-text">Extraordinaire</span>
        </h1>
        <p className="text-lg text-muted-foreground">
          Partagez votre passion et connectez une communauté autour de votre événement.
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Form Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2"
        >
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Titre de l'événement</FormLabel>
                      <FormControl>
                        <Input placeholder="ex: Festival de Musique d'Été" {...field} className="h-12 text-lg" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Lieu</FormLabel>
                      <FormControl>
                        <Input placeholder="ex: Parc Central, Lyon" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="startDatetime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date & Heure de début</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input type="datetime-local" {...field} className="pl-10" />
                          <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDatetime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date & Heure de fin (Optionnel)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input type="datetime-local" {...field} className="pl-10" />
                          <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prix (€)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" {...field} />
                      </FormControl>
                      <FormDescription>Laissez à 0 pour les événements gratuits</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacité</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Tags</FormLabel>
                      <FormControl>
                        <Input placeholder="musique, plein air, festival (séparés par des virgules)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Image de couverture</FormLabel>
                      <FormControl>
                      <div className="space-y-4">
                {imagePreview && (
                  <div className="relative w-full h-52 rounded-xl overflow-hidden border-2 border-border">
                    <img 
                      src={imagePreview} 
                      alt="Aperçu" 
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview("");
                        setSelectedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="absolute top-2 right-2 bg-destructive/90 text-white p-2 rounded-lg hover:bg-destructive transition-all shadow-lg"
                    >
                      ✕
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary hover:bg-primary/5 transition-all group"
                >
                  <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground group-hover:text-primary transition-colors" />
                  <p className="text-sm font-semibold mb-1">Cliquez ou glissez une image</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG, GIF (max 5MB)</p>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>
                      </FormControl>
                      <FormDescription>L'image sera uploadée après la création de l'événement</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Décrivez votre événement..." 
                          className="min-h-[150px] resize-y" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-border/50">
                <Button type="button" variant="outline" onClick={() => setLocation("/")} className="rounded-lg">
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  className="bg-gradient-to-r from-primary to-secondary text-white border-0 rounded-lg px-6 font-semibold hover:shadow-lg transition-all"
                  disabled={createEventMutation.isPending || uploadImageMutation.isPending}
                >
                  {(createEventMutation.isPending || uploadImageMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {createEventMutation.isPending ? "Création..." : uploadImageMutation.isPending ? "Upload..." : "Créer"}
                </Button>
              </div>
            </form>
          </Form>
        </motion.div>
        </div>

        {/* Preview Section */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-1"
        >
          <div className="sticky top-24 space-y-4">
            <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Aperçu de votre carte
            </div>
            
            {/* Event Card Preview */}
            <div className="event-card overflow-hidden">
              <div className="event-image-wrapper">
                {imagePreview ? (
                  <img 
                    src={imagePreview} 
                    alt={form.watch("title") || "Événement"} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-secondary/20 bg-gradient-to-br from-secondary/5 to-transparent">
                    <CalendarIcon className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <Badge className="glass-badge bg-white/80">
                    {Number(form.watch("price")) === 0 ? "Gratuit" : `€${form.watch("price") || 0}`}
                  </Badge>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div className="flex gap-2 flex-wrap">
                  {form.watch("tags")?.split(",").slice(0, 2).map((tag, i) => (
                    <Badge key={i} className="text-[10px] font-bold uppercase tracking-wide bg-primary/15 text-primary border-0">
                      {tag.trim()}
                    </Badge>
                  ))}
                </div>

                <h3 className="text-base font-bold line-clamp-2">
                  {form.watch("title") || "Titre de l'événement"}
                </h3>

                <div className="space-y-1.5 text-xs text-muted-foreground">
                  {form.watch("startDatetime") && (
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-secondary" />
                      <span>{format(new Date(form.watch("startDatetime")), "d MMM • HH:mm")}</span>
                    </div>
                  )}
                  {form.watch("location") && (
                    <div className="flex items-center gap-2 truncate">
                      <MapPin className="w-4 h-4 text-secondary" />
                      <span className="truncate">{form.watch("location")}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-secondary" />
                    <div className="flex-1 bg-muted h-1 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-primary to-secondary h-full w-1/3" />
                    </div>
                    <span className="text-xs font-semibold">0/{form.watch("capacity") || 100}</span>
                  </div>
                </div>

                <Button size="sm" className="w-full h-9 bg-gradient-to-r from-primary to-secondary text-white border-0 rounded-lg font-semibold">
                  Rejoindre
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
  );
}
