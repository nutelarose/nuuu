"use client";

import { useEffect, useState } from "react";
import Beleg from "@/components/Beleg";
import { Button } from "@/components/ui/button";
import { Plus, Settings, House, CircleCheckBig } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { ALL_ITEMS } from "../const/const";
import { toast } from "@/components/ui/use-toast";

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

function Dashboard() {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const allItems = ALL_ITEMS;
  const menuItems = [
    { name: "Crepes", color: "bg-red-500" },
    { name: "Extra", color: "bg-pink-500" },
    { name: "Pancake", color: "bg-blue-500" },
    { name: "Mini Pancakes", color: "bg-orange-900" },
    { name: "Waffles", color: "bg-purple-500" },
    { name: "Fruit Salad", color: "bg-pink-800" },
    { name: "Alcohol Free Cocktail/Drink", color: "bg-blue-400" },
    { name: "Fresh Juice", color: "bg-green-700" },
    { name: "Ice", color: "bg-gray-800 " },
    { name: "Milkshake & Sahne", color: "bg-gray-400" },
    { name: "Bubble Tea (Green-Black)", color: "bg-indigo-400" },
    { name: "Milk Bubble Tea", color: "bg-red-400" },
    { name: "Kaffee & Hot Chocolate", color: "bg-blue-700" },
    { name: "Chai Latte & Tea", color: "bg-pink-400" },
    { name: "Cola/Redbull", color: "bg-black " },
  ];

  const [belegs, setBelegs] = useState<BelegData[]>([]);
  const [displayedBelegs, setDisplayedBelegs] = useState<BelegData[]>([]);
  const [selectedBeleg, setSelectedBeleg] = useState<BelegData | null>(null);
  const [isAllBelegs, setIsAllBelegs] = useState<boolean>(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const supabase = createClientComponentClient();

  const [userId, setUserId] = useState("");

  const getUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user !== null) {
        setUserId(user.id);
      } else {
        setUserId("");
      }
    } catch (e) {}
  };

  const updateItemQuantity = async (
    belegId: number,
    itemName: string,
    newQuantity: number
  ) => {
    try {
      let updatedItems = belegs.map((beleg) => {
        if (beleg.id === belegId) {
          const updatedItems = beleg.items
            .map((item) => {
              if (item.name === itemName) {
                return newQuantity === 0
                  ? null
                  : { ...item, quantity: newQuantity };
              }
              return item;
            })
            .filter((item) => item !== null); // Remove null items
          return { ...beleg, items: updatedItems };
        }
        return beleg;
      });

      setBelegs(updatedItems);
      setDisplayedBelegs(updatedItems);

      if (newQuantity === 0) {
        // Delete item from Supabase if quantity is zero
        const { error } = await supabase
          .from("item")
          .delete()
          .eq("beleg_id", belegId)
          .eq("name", itemName);

        if (error) {
          console.error("Error deleting item:", error.message);
        }
      } else {
        // Update item quantity in Supabase
        const { error } = await supabase
          .from("item")
          .update({ quantity: newQuantity })
          .eq("beleg_id", belegId)
          .eq("name", itemName);

        if (error) {
          console.error("Error updating item quantity:", error.message);
        }
      }
    } catch (error: any) {
      console.error("Error updating item quantity:", error.message);
    }
  };

  useEffect(() => {
    // Fetch belegs and items from Supabase
    getUser();

    const fetchBelegs = async () => {
      const { data: belegsData, error: belegsError } = await supabase
        .from("beleg")
        .select("*")

        .order("id", { ascending: false });
      if (belegsError) console.error(belegsError);

      const { data: itemsData, error: itemsError } = await supabase
        .from("item")
        .select("*");
      if (itemsError) console.error(itemsError);

      // Transform the fetched data into the desired format
      const belegsWithItems = belegsData!.map((beleg) => {
        const items = itemsData!
          .filter((item) => item.beleg_id === beleg.id)
          .map((item) => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          }));
        console.log(beleg.createdAt);

        return {
          id: beleg.id,
          createdAt: beleg.createdAt,
          isPaid: beleg.isPaid,
          isToGo: beleg.isToGo,
          items,
        };
      });

      setBelegs(belegsWithItems);
      setDisplayedBelegs(belegsWithItems);
    };

    fetchBelegs();
  }, [userId]);

  const addBeleg = async () => {
    const now = new Date();
    const formattedDate = `${now.getDate().toString().padStart(2, "0")}-${(
      now.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}-${now.getFullYear()}`;
    const formattedTime = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
    const formattedDateTime = `${formattedDate} | ${formattedTime}`;

    const newBeleg: BelegData = {
      id: belegs.length + 1,
      isPaid: false,
      isToGo: false,
      items: [],
      createdAt: formattedDateTime,
    };

    try {
      // Insert new beleg into the database
      const { data, error } = await supabase.from("beleg").insert([
        {
          user_id: userId,
          id: newBeleg.id,
          isPaid: newBeleg.isPaid,
          isToGo: newBeleg.isToGo,
          createdAt: newBeleg.createdAt,
        },
      ]);

      if (error) {
        throw error;
      }

      // Update local state
      setBelegs([newBeleg, ...belegs]);
      setDisplayedBelegs([newBeleg, ...displayedBelegs]);
      setSelectedBeleg(newBeleg);

      if (!isAllBelegs) {
        setDisplayedBelegs([newBeleg, ...belegs]);
        setIsAllBelegs(true);
      }
    } catch (error: any) {
      console.error("Error adding new beleg:", error.message);
      // Handle error as needed
    }
  };

  const showAllBelegs = () => {
    setDisplayedBelegs(belegs);
    setIsAllBelegs(true);
    setIsDialogOpen(!isDialogOpen);
  };

  const showOpenBelegs = () => {
    const openBelegs = belegs.filter((beleg) => !beleg.isPaid);
    setDisplayedBelegs(openBelegs);
    setIsAllBelegs(false);
    setIsDialogOpen(!isDialogOpen);
  };

  const handleToGoClick = async () => {
    if (selectedBeleg) {
      try {
        const updatedBelegs = belegs.map((beleg) =>
          beleg.id === selectedBeleg.id
            ? { ...beleg, isToGo: !beleg.isToGo }
            : beleg
        );
        const { data, error } = await supabase
          .from("beleg")
          .update({ isToGo: !selectedBeleg.isToGo })
          .eq("id", selectedBeleg.id);
        if (error) throw error;
        setBelegs(updatedBelegs);
        setDisplayedBelegs(updatedBelegs);
        setSelectedBeleg((prevSelected) =>
          prevSelected
            ? { ...prevSelected, isToGo: !prevSelected.isToGo }
            : null
        );

        // Switch view if necessary
        if (!isAllBelegs && !selectedBeleg.isToGo) {
          const toGoBelegs = updatedBelegs.filter((beleg) => beleg.isToGo);
          setDisplayedBelegs(toGoBelegs);
          setIsAllBelegs(true);
        } else if (isAllBelegs && selectedBeleg.isToGo) {
          const toGoBelegs = updatedBelegs.filter((beleg) => beleg.isToGo);
          setDisplayedBelegs(toGoBelegs);
          setIsAllBelegs(false);
        }
      } catch (error: any) {
        toast({
          title: "Uh oh! Something went wrong.",
          description: "There was a problem with your request.",
        });
      }
    }
  };

  const handlePaidClick = async () => {
    if (selectedBeleg) {
      try {
        const updatedBelegs = belegs.map((beleg) =>
          beleg.id === selectedBeleg.id
            ? { ...beleg, isPaid: !beleg.isPaid }
            : beleg
        );
        const { data, error } = await supabase
          .from("beleg")
          .update({ isPaid: !selectedBeleg.isPaid })
          .eq("id", selectedBeleg.id);
        if (error) throw error;
        setBelegs(updatedBelegs);
        setDisplayedBelegs(updatedBelegs);
        setSelectedBeleg((prevSelected) =>
          prevSelected
            ? { ...prevSelected, isPaid: !prevSelected.isPaid }
            : null
        );

        // Switch view if necessary
        if (!isAllBelegs && !selectedBeleg.isPaid) {
          const openBelegs = updatedBelegs.filter((beleg) => !beleg.isPaid);
          setDisplayedBelegs(openBelegs);
          setIsAllBelegs(true);
        } else if (isAllBelegs && selectedBeleg.isPaid) {
          const openBelegs = updatedBelegs.filter((beleg) => !beleg.isPaid);
          setDisplayedBelegs(openBelegs);
          setIsAllBelegs(false);
        }
      } catch (error: any) {
        toast({
          title: "Uh oh! Something went wrong.",
          description: "There was a problem with your request.",
        });
      }
    }
  };

  const selectBelegForEdit = (belegId: number) => {
    const selected = displayedBelegs.find(
      (beleg) => beleg.id === belegId && !beleg.isPaid
    );
    if (selected) {
      setSelectedBeleg(selected);
    }
  };

  const addItemToBeleg = async (item: Item) => {
    if (!selectedBeleg) {
      console.error("No selected beleg found.");
      return;
    }

    const itemName = item.name;
    const itemPrice = item.price;

    try {
      // Check if item already exists in the selectedBeleg
      const existingItemIndex = selectedBeleg.items.findIndex(
        (item) => item.name === itemName
      );

      if (existingItemIndex !== -1) {
        // Item already exists, update its quantity locally
        const updatedItems = selectedBeleg.items.map((item, index) => {
          if (index === existingItemIndex) {
            return { ...item, quantity: item.quantity + 1 }; // Increase quantity by 1
          }
          return item;
        });

        // Update local state immediately
        const updatedBeleg = { ...selectedBeleg, items: updatedItems };
        const updatedBelegs = belegs.map((beleg) =>
          beleg.id === selectedBeleg.id ? updatedBeleg : beleg
        );

        setSelectedBeleg(updatedBeleg);
        setBelegs(updatedBelegs);

        // Update displayedBelegs based on isAllBelegs
        if (isAllBelegs) {
          setDisplayedBelegs([...belegs]);
        } else {
          const openBelegs = belegs.filter((beleg) => !beleg.isPaid);
          setDisplayedBelegs([...openBelegs]);
        }

        // Update in database using Supabase
        const { error } = await supabase
          .from("item")
          .update({ quantity: updatedItems[existingItemIndex].quantity })
          .eq("beleg_id", selectedBeleg.id)
          .eq("name", itemName);

        if (error) {
          console.error("Error updating item quantity:", error.message);
        }
      } else {
        // Item doesn't exist, add new item to the selectedBeleg locally
        const newItem = {
          name: itemName,
          price: itemPrice,
          quantity: 1, // Initial quantity is 1
        };

        // Update local state immediately
        const updatedBeleg = {
          ...selectedBeleg,
          items: [...selectedBeleg.items, newItem],
        };
        const updatedBelegs = belegs.map((beleg) =>
          beleg.id === selectedBeleg.id ? updatedBeleg : beleg
        );

        setSelectedBeleg(updatedBeleg);
        setBelegs(updatedBelegs);

        // Update displayedBelegs based on isAllBelegs
        if (isAllBelegs) {
          setDisplayedBelegs([...belegs]);
        } else {
          const openBelegs = belegs.filter((beleg) => !beleg.isPaid);
          setDisplayedBelegs([...openBelegs]);
        }

        // Insert new item into the database
        const { data, error } = await supabase.from("item").insert({
          beleg_id: selectedBeleg.id,
          name: newItem.name,
          price: newItem.price,
          quantity: newItem.quantity,
        });

        if (error) {
          console.error("Error adding new item:", error.message);
        }
      }
    } catch (error: any) {
      console.error("Error adding item to beleg:", error.message);
    }
  };

  const [isCustomItemDialogOpen, setIsCustomItemDialogOpen] = useState(false);
  const [customItemName, setCustomItemName] = useState("");
  const [customItemPrice, setCustomItemPrice] = useState<number>(0);

  // Function to add custom item
  const addCustomItem = async () => {
    if (!selectedBeleg) return;

    const newCustomItem: Item = {
      name: customItemName,
      price:
        typeof customItemPrice === "number"
          ? customItemPrice
          : parseFloat(customItemPrice),
      quantity: 1,
    };

    const existingItemIndex = selectedBeleg.items.findIndex(
      (item) => item.name === newCustomItem.name
    );

    let updatedItems;

    if (existingItemIndex !== -1) {
      // If the item already exists, update its quantity
      updatedItems = selectedBeleg.items.map((item, index) =>
        index === existingItemIndex
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      // If the item doesn't exist, add it to the items array
      updatedItems = [...selectedBeleg.items, newCustomItem];
    }

    const updatedBeleg = {
      ...selectedBeleg,
      items: updatedItems,
    };

    const updatedBelegs = belegs.map((beleg) =>
      beleg.id === selectedBeleg.id ? updatedBeleg : beleg
    );

    setBelegs(updatedBelegs);
    setDisplayedBelegs(updatedBelegs);
    setSelectedBeleg(updatedBeleg);

    // Save to Supabase
    try {
      if (existingItemIndex !== -1) {
        // Update existing item quantity in Supabase
        const updatedItem = updatedItems[existingItemIndex];
        const { data, error } = await supabase
          .from("item")
          .update({ quantity: updatedItem.quantity })
          .eq("beleg_id", selectedBeleg.id)
          .eq("name", updatedItem.name);
        if (error) throw error;
      } else {
        // Insert new item into Supabase
        const { data, error } = await supabase.from("item").insert([
          {
            beleg_id: selectedBeleg.id,
            name: newCustomItem.name,
            price: newCustomItem.price,
            quantity: newCustomItem.quantity,
          },
        ]);
        if (error) throw error;
      }

      // Reset custom item dialog state
      setCustomItemName("");
      setCustomItemPrice(0);
      setIsCustomItemDialogOpen(false);

      // Show success toast notification
    } catch (error: any) {
      console.error("Error adding/updating custom item:", error.message);

      // Show error toast notification
    }
  };

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[260px_1fr] lg:grid-cols-[260px_1fr]">
      {/* Left Bar */}
      <div className="border-r bg-muted/40 max-h-[100vh] sticky top-0">
        <div className="flex h-full flex-col gap-2 px-2">
          <div className="flex h-14 items-center border-b gap-1">
            <Button
              variant={"default"}
              className="flex-1 bg-red-600 hover:bg-red-700 w-full "
              onClick={showOpenBelegs}
            >
              Offene Belege
            </Button>
            <Button
              variant={"default"}
              className="flex-1 bg-red-600 hover:bg-red-700 w-full "
              onClick={showAllBelegs}
            >
              Alle Belege
            </Button>
          </div>

          <div className="flex-1">
            {selectedBeleg && (
              <Beleg
                beleg={selectedBeleg}
                updateItemQuantity={updateItemQuantity}
                isLeftBar={true}
              />
            )}
          </div>

          <div className="flex justify-center items-center gap-2">
            <Button
              className={`py-1 px-4 text-white w-full ${
                selectedBeleg?.isToGo
                  ? "bg-green-500"
                  : "bg-gray-200 hover:none"
              }`}
              onClick={handleToGoClick}
              disabled={!selectedBeleg}
            >
              <House className={selectedBeleg?.isToGo ? "" : "text-gray-400"} />
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant={"outline"}
                  className={`w-full ${
                    selectedBeleg?.isPaid
                      ? "bg-green-500"
                      : "bg-gray-200 hover:none"
                  }`}
                >
                  <CircleCheckBig />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Aktueller Beleg</DialogTitle>
                  <DialogDescription>Ist der Beleg fertig?</DialogDescription>
                </DialogHeader>
                <DialogClose asChild>
                  <Button
                    onClick={handlePaidClick}
                    disabled={!selectedBeleg || selectedBeleg.isPaid}
                  >
                    Fertig!
                  </Button>
                </DialogClose>
              </DialogContent>
            </Dialog>
          </div>

          <Button
            variant={"default"}
            className="mb-2 py-6 font-bold text-md"
            onClick={addBeleg}
          >
            <Plus className="h-6 w-6 mr-5" />
            Neuer Verkauf
          </Button>
        </div>
      </div>
      {/* Dashboard */}
      <div className=" gap-4 grid flex-1 overflow-y-auto">
        {isDialogOpen ? (
          <div className="p-2">
            <div className="flex justify-between items-center ">
              <h1 className="text-xl font-bold mb-2 ml-1">Belege</h1>
              {isAllBelegs && (
                <p className="text-lg font-medium">
                  EUR:{" "}
                  {displayedBelegs
                    .reduce(
                      (total, beleg) =>
                        total +
                        beleg.items.reduce(
                          (sum, item) => sum + item.price * item.quantity,
                          0
                        ),
                      0
                    )
                    .toFixed(2)}
                </p>
              )}
            </div>
            <div className={`grid gap-2 p-2`}>
              {displayedBelegs.map((beleg) => (
                <div
                  key={beleg.id}
                  onClick={() => selectBelegForEdit(beleg.id)}
                  className={`cursor-pointer ${
                    !beleg.isPaid ? "bg-red-50" : ""
                  }`}
                >
                  <Beleg
                    beleg={beleg}
                    updateItemQuantity={updateItemQuantity}
                    isLeftBar={false}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="min-h-screen bg-gray-100 flex flex-col justify-between">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 p-2">
              <div className="col-span-full text-center">
                <h2
                  className={`text-lg font-semibold ${menuItems[selectedIndex].color} rounded-md text-white text-left font-normal pl-2`}
                >
                  {menuItems[selectedIndex].name}
                </h2>
              </div>
              {allItems[selectedIndex].map((item, index) => (
                <div
                  key={index}
                  className={`flex aspect-w-1 aspect-h-1 justify-center items-center p-2 text-left rounded-md flex-col ${menuItems[selectedIndex].color}`}
                  onClick={() => addItemToBeleg({ ...item, quantity: 1 })}
                >
                  <div className="flex-1 justify-center items-center pb-1">
                    <p className="font-bold text-md text-white flex justify-center items-center text-center">
                      {item.name}
                    </p>
                  </div>
                  <p className="text-center text-white font-light">
                    {item.price.toFixed(2)} EUR/Stk
                  </p>
                </div>
              ))}
              {menuItems[selectedIndex].name === "Extra" && (
                <div
                  className="flex aspect-w-1 aspect-h-1 justify-center items-center p-2 text-left rounded-md flex-col bg-pink-700"
                  onClick={() => setIsCustomItemDialogOpen(true)}
                >
                  <p className="font-bold text-md text-white flex justify-center items-center text-center">
                    Extra
                  </p>
                </div>
              )}
            </div>
            <div className="p-2 w-full text-white">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                {menuItems.map((item, index) => (
                  <button
                    key={index}
                    className={`${item.color} text-center py-2 px-1 rounded-lg`}
                    onClick={() => setSelectedIndex(index)}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      <Dialog
        open={isCustomItemDialogOpen}
        onOpenChange={setIsCustomItemDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extra hinzufügen</DialogTitle>
            <DialogDescription>Name und Preis hinzufügen</DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <label className="block mb-2">Name</label>
            <input
              type="text"
              className="border p-2 rounded w-full"
              value={customItemName}
              onChange={(e) => setCustomItemName(e.target.value)}
            />
          </div>
          <div className="mt-4">
            <label className="block mb-2">Preis</label>
            <input
              type="number"
              className="border p-2 rounded w-full"
              value={customItemPrice === 0 ? "" : customItemPrice.toString()}
              placeholder="0"
              onChange={(e) => setCustomItemPrice(parseFloat(e.target.value))}
            />
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={addCustomItem}>Hinzufügen</Button>
            <DialogClose asChild>
              <Button variant={"secondary"} className="ml-2">
                Abbrechen
              </Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Dashboard;
