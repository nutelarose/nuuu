import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { CircleCheckBig, Home } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "@radix-ui/react-dialog";
import { DialogHeader, DialogFooter } from "./ui/dialog";

interface Item {
  name: string;
  price: number;
  quantity: number;
}

interface BelegData {
  id: number;
  isPaid: boolean;
  isToGo: boolean;
  items: Item[];
  createdAt: string;
}

interface BelegProps {
  beleg: BelegData;
  updateItemQuantity: (
    id: number,
    itemName: string,
    newQuantity: number
  ) => void;
  isLeftBar: boolean;
}

const Beleg = ({ beleg, updateItemQuantity, isLeftBar }: BelegProps) => {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [newQuantity, setNewQuantity] = useState<number>(0);

  const handleItemClick = (item: Item) => {
    if (isLeftBar) {
      setSelectedItem(item);
      setNewQuantity(item.quantity);
    }
  };

  const handleSubmit = () => {
    if (selectedItem) {
      selectedItem.quantity = newQuantity;
      if (selectedItem.quantity === 0) {
        beleg.items = beleg.items.filter(
          (item) => item.name !== selectedItem.name
        );
      }
      updateItemQuantity(beleg.id, selectedItem.name, newQuantity);
      setSelectedItem(null);
      setNewQuantity(0);
    }
  };

  const calculateTotalPrice = () => {
    return beleg.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  return (
    <div className="p-4 pb-2 border rounded-md shadow-md w-full">
      <div className="mb-4">
        <p className="font-bold text-lg flex">
          Beleg: {beleg.id}{" "}
          <div className="ml-2 flex">
            {beleg.isToGo && (
              <p className="font-light text-sm text-red-700 flex items-center">
                | <Home className="h-4" />
              </p>
            )}
            {beleg.isPaid && (
              <p className="font-light text-sm text-green-700 flex items-center">
                | <CircleCheckBig className="h-4" />
              </p>
            )}
          </div>
        </p>
        <p className="py-1 text-sm text-gray-600">{beleg.createdAt}</p>
      </div>

      <Dialog>
        <DialogTrigger asChild>
          <div className="max-h-80 overflow-y-auto mb-4 border-t pt-2">
            {beleg.items.map((item) => (
              <div
                key={item.name}
                className={`flex justify-between items-center py-1 ${
                  isLeftBar ? "cursor-pointer" : ""
                }`}
                onClick={() => handleItemClick(item)}
              >
                <div className="flex flex-col">
                  <span className="font-semibold">{item.quantity} Stk</span>
                  <span className="text-xs text-gray-600">{item.name}</span>
                </div>
                <span className="ml-auto">{item.price?.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </DialogTrigger>
        {selectedItem && isLeftBar && (
          <DialogContent className="sm:max-w-[425px] max-h-96 overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-bold">
                Menge ändern: {selectedItem.name}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex items-center gap-4 justify-center">
                <Button
                  onClick={() => setNewQuantity(Math.max(0, newQuantity - 1))}
                >
                  -
                </Button>
                <span>{newQuantity}</span>
                <Button onClick={() => setNewQuantity(newQuantity + 1)}>
                  +
                </Button>
              </div>
              <Button onClick={handleSubmit}>Speichern</Button>
            </div>
            <DialogFooter>
              <DialogClose asChild></DialogClose>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      <div className="border-t pt-2">
        <p className="font-bold flex justify-between text-lg">
          <label>EUR</label>
          {calculateTotalPrice().toFixed(2)}
        </p>
      </div>
    </div>
  );
};

export default Beleg;
