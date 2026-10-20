import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Leaf, Plus, Trash2, Calculator } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Ingredient {
  name: string;
  grams: number;
}

interface HerbalFormulationModalProps {
  open: boolean;
  onClose: () => void;
}

export function HerbalFormulationModal({ open, onClose }: HerbalFormulationModalProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [durationDays, setDurationDays] = useState(14);
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { name: "Dried Neem Leaf Powder", grams: 50 },
    { name: "Ashwagandha Root", grams: 30 },
  ]);

  const addIngredient = () => {
    setIngredients([...ingredients, { name: "", grams: 10 }]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const totalGrams = ingredients.reduce((sum, ing) => sum + (ing.grams || 0), 0);

  const handleSave = () => {
    if (!title.trim()) {
      toast({ title: "Formulation Title Required", variant: "destructive" });
      return;
    }
    toast({
      title: "🌿 Herbal Formulation Saved",
      description: `Saved ${title} (${totalGrams}g total) for a ${durationDays}-day course.`,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400">
            <Leaf className="h-5 w-5 text-emerald-600" /> Herbal Formulation Builder
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs">
          <div className="grid gap-1">
            <Label className="text-xs font-semibold">Formulation / Mixture Title</Label>
            <Input
              placeholder="e.g. Cleansing Herbal Tea Blend"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          <div className="grid gap-1">
            <Label className="text-xs font-semibold">Course Duration (Days)</Label>
            <Input
              type="number"
              value={durationDays}
              onChange={(e) => setDurationDays(Number(e.target.value))}
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-2 border-t pt-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">Raw Herbal Ingredients (Grams)</Label>
              <Button variant="outline" size="sm" onClick={addIngredient} className="h-7 text-[11px]">
                <Plus className="mr-1 h-3 w-3" /> Add Ingredient
              </Button>
            </div>

            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {ingredients.map((ing, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    placeholder="Herb name..."
                    value={ing.name}
                    onChange={(e) => {
                      const updated = [...ingredients];
                      updated[idx].name = e.target.value;
                      setIngredients(updated);
                    }}
                    className="h-8 text-xs flex-1"
                  />
                  <Input
                    type="number"
                    placeholder="Grams"
                    value={ing.grams}
                    onChange={(e) => {
                      const updated = [...ingredients];
                      updated[idx].grams = Number(e.target.value);
                      setIngredients(updated);
                    }}
                    className="h-8 text-xs w-20 text-right"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeIngredient(idx)}
                    className="h-8 w-8 text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between p-2 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
              <span>Total Blend Weight:</span>
              <span>{totalGrams} grams</span>
            </div>
          </div>

          <div className="grid gap-1">
            <Label className="text-xs font-semibold">Preparation & Decoction Notes</Label>
            <Textarea
              placeholder="e.g. Boil 1 tablespoon (15g) in 500ml water for 15 minutes. Drink warm twice daily after meals."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="text-xs h-16 resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} size="sm">
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-emerald-800 hover:bg-emerald-900 text-white" size="sm">
            Save Formulation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
