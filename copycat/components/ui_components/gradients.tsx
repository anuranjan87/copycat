
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ClipboardCopyIcon,
  SaveIcon,
  Lock,
} from "lucide-react";

import { useSubscription } from "@/components/subscription-provider";
import PremiumRequiredModal from "@/components/ui_components/PremiumRequiredModal";

export default function Gradient() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const { isPremium } = useSubscription();

 const gradients = [
    { name: "Apple Green", code: "bg-gradient-to-r from-green-500 to-green-700" },
{ name: "Microsoft Blue", code: "bg-gradient-to-r from-blue-500 to-blue-700" },
{ name: "Amazon Yellow", code: "bg-gradient-to-r from-yellow-400 to-yellow-600" },
{ name: "Tesla Red", code: "bg-gradient-to-r from-red-500 to-red-700" },
{ name: "Google Purple", code: "bg-gradient-to-r from-purple-400 to-purple-600" },
{ name: "Facebook Blue", code: "bg-gradient-to-r from-blue-600 to-blue-800" },
{ name: "Walmart Blue", code: "bg-gradient-to-r from-blue-400 to-blue-600" },
{ name: "Berkshire Hathaway Gold", code: "bg-gradient-to-r from-yellow-500 to-yellow-700" },
{ name: "ExxonMobil Red", code: "bg-gradient-to-r from-red-600 to-red-800" },
{ name: "Johnson & Johnson Red", code: "bg-gradient-to-r from-red-400 to-red-600" },
{ name: "Corporate Blue", code: "bg-gradient-to-r from-blue-500 to-blue-700" },
{ name: "Professional Grey", code: "bg-gradient-to-r from-gray-300 to-gray-500" },
{ name: "Innovative Green", code: "bg-gradient-to-r from-green-400 to-green-600" },
{ name: "Trustworthy Navy", code: "bg-gradient-to-r from-blue-700 to-blue-900" },
{ name: "Dynamic Orange", code: "bg-gradient-to-r from-orange-400 to-orange-600" },
{ name: "Elegant Teal", code: "bg-gradient-to-r from-teal-400 to-teal-600" },
{ name: "Modern Lavender", code: "bg-gradient-to-r from-purple-300 to-purple-500" },
{ name: "Sleek Black", code: "bg-gradient-to-r from-gray-800 to-gray-900" },
{ name: "Vibrant Red", code: "bg-gradient-to-r from-red-500 to-red-700" },
{ name: "Clean White", code: "bg-gradient-to-r from-white to-gray-100" },
{ name: "Sophisticated Gold", code: "bg-gradient-to-r from-yellow-400 to-yellow-600" },
{ name: "Balanced Brown", code: "bg-gradient-to-r from-gray-600 to-gray-800" },
{ name: "Energetic Coral", code: "bg-gradient-to-r from-orange-300 to-orange-500" },
{ name: "Focused Indigo", code: "bg-gradient-to-r from-indigo-500 to-indigo-700" },
{ name: "Strategic Cyan", code: "bg-gradient-to-r from-cyan-400 to-cyan-600" },
{ name: "Resourceful Mint", code: "bg-gradient-to-r from-teal-300 to-teal-500" },
{ name: "Progressive Yellow", code: "bg-gradient-to-r from-yellow-300 to-yellow-500" },
{ name: "Insightful Plum", code: "bg-gradient-to-r from-purple-500 to-purple-700" },
{ name: "Trustworthy Slate", code: "bg-gradient-to-r from-gray-500 to-gray-700" },
{ name: "Confident Berry", code: "bg-gradient-to-r from-pink-400 to-pink-600" },
    { name: "Sunset Glow", code: "bg-gradient-to-r from-red-500 to-orange-500"},
    { name: "Hyper", code: "bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500" },
    { name: "Oceanic", code: "bg-gradient-to-r from-green-300 via-blue-500 to-purple-600" },
    { name: "Ocean Breeze", code: "bg-gradient-to-r from-blue-200 to-cyan-200" },
    { name: "Cotton Candy", code: "bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-400" },
    { name: "Gotham", code: "bg-gradient-to-r from-gray-700 via-gray-900 to-black" },
    { name: "Sunset", code: "bg-gradient-to-r from-orange-300 to-rose-500" },
    { name: "Mystic Blue", code: "bg-gradient-to-r from-indigo-500 to-blue-500" },
    { name: "Mojave", code: "bg-gradient-to-r from-yellow-100 via-yellow-300 to-yellow-500" },
    { name: "Beachside", code: "bg-gradient-to-r from-yellow-200 via-green-200 to-green-500" },
    { name: "Gunmetal", code: "bg-gradient-to-r from-gray-200 via-gray-400 to-gray-600" },
    { name: "Peachy", code: "bg-gradient-to-r from-red-200 via-red-300 to-yellow-200" },
    { name: "Sunny Delight", code: "bg-gradient-to-r from-yellow-200 to-orange-400" },
  { name: "Minty Fresh", code: "bg-gradient-to-r from-teal-200 to-lime-200" },
  { name: "Lavender Bliss", code: "bg-gradient-to-r from-purple-300 to-pink-300" },
  { name: "Rainbow Mist", code: "bg-gradient-to-r from-indigo-200 via-red-200 to-yellow-100" },
  { name: "Dark Knight", code: "bg-gradient-to-r from-gray-700 to-gray-900" },
  { name: "Forest Walk", code: "bg-gradient-to-r from-green-300 to-green-500" },
  { name: "Crimson Horizon", code: "bg-gradient-to-r from-red-500 to-purple-500" },
    { name: "Northern Lights", code: "bg-gradient-to-r from-blue-400 via-teal-500 to-green-400" },
    { name: "Sunset Vibes", code: "bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500" },
    { name: "Forest Mist", code: "bg-gradient-to-r from-green-200 via-green-300 to-blue-500" },
    { name: "Lavender Dream", code: "bg-gradient-to-r from-indigo-300 via-purple-400 to-pink-400" },
    { name: "Sahara", code: "bg-gradient-to-r from-yellow-600 via-red-500 to-pink-500" },
    { name: "Cool Blues", code: "bg-gradient-to-r from-cyan-500 to-blue-500" },
    { name: "Witching Hour", code: "bg-gradient-to-r from-purple-900 via-violet-600 to-purple-300" },
    { name: "Sherbet", code: "bg-gradient-to-r from-pink-300 via-orange-300 to-yellow-200" },
    { name: "Frozen Lake", code: "bg-gradient-to-r from-indigo-200 via-cyan-400 to-cyan-200" },
    { name: "Mango Pulp", code: "bg-gradient-to-r from-yellow-300 via-orange-300 to-red-300" },
    { name: "Midnight City", code: "bg-gradient-to-r from-blue-900 via-purple-900 to-pink-900" },
    { name: "Sea Foam", code: "bg-gradient-to-r from-green-200 via-teal-200 to-teal-500" },
    { name: "Bubblegum", code: "bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-300" },
    { name: "Ripe Peach", code: "bg-gradient-to-r from-orange-200 via-orange-300 to-red-300" },
    { name: "Deep Ocean", code: "bg-gradient-to-r from-blue-900 via-blue-700 to-blue-500" },
    { name: "Fresh Lime", code: "bg-gradient-to-r from-lime-200 via-lime-400 to-lime-500" },
    { name: "Cosmic Fusion", code: "bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600" },
    { name: "Autumn Leaves", code: "bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600" },
    { name: "Winter Sky", code: "bg-gradient-to-r from-blue-100 via-blue-300 to-blue-500" },
    { name: "Cherry Blossom", code: "bg-gradient-to-r from-pink-100 via-pink-300 to-pink-500" },
    { name: "Emerald Dream", code: "bg-gradient-to-r from-green-300 via-green-400 to-green-500" },
    { name: "Golden Hour", code: "bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-700" },
    { name: "Twilight", code: "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" },
    { name: "Tropical Paradise", code: "bg-gradient-to-r from-green-300 via-yellow-300 to-pink-300" },
    { name: "Arctic Chill", code: "bg-gradient-to-r from-blue-100 via-blue-200 to-blue-300" },
    { name: "Desert Rose", code: "bg-gradient-to-r from-red-200 via-red-300 to-yellow-200" },
    { name: "Electric Violet", code: "bg-gradient-to-r from-purple-300 via-purple-400 to-purple-500" },
    { name: "Citrus Burst", code: "bg-gradient-to-r from-yellow-200 via-orange-400 to-orange-500" },
    { name: "Misty Mountain", code: "bg-gradient-to-r from-gray-400 via-gray-600 to-blue-800" },
    { name: "Golden Sunset", code: "bg-gradient-to-r from-yellow-500 to-orange-500" },
  { name: "Royal Velvet", code: "bg-gradient-to-r from-purple-700 to-indigo-900" },
  { name: "Emerald Luxe", code: "bg-gradient-to-r from-green-600 to-teal-700" },
  { name: "Midnight Gold", code: "bg-gradient-to-r from-gray-800 to-yellow-500" },
  { name: "Ruby Wine", code: "bg-gradient-to-r from-red-700 to-purple-800" },
  { name: "Sapphire Glow", code: "bg-gradient-to-r from-blue-600 to-indigo-700" },
  { name: "Silver Lining", code: "bg-gradient-to-r from-gray-300 to-gray-500" },
  { name: "Rose Gold", code: "bg-gradient-to-r from-pink-300 to-yellow-200" },
  { name: "Champagne Toast", code: "bg-gradient-to-r from-yellow-200 to-pink-100" },
  { name: "Bronze Age", code: "bg-gradient-to-r from-orange-600 to-yellow-700" },
  { name: "Platinum Shine", code: "bg-gradient-to-r from-gray-200 to-gray-400" },
  { name: "Obsidian Depths", code: "bg-gradient-to-r from-gray-900 to-black" },
  { name: "Amethyst Light", code: "bg-gradient-to-r from-purple-500 to-purple-700" },
  { name: "Onyx Night", code: "bg-gradient-to-r from-black to-gray-800" },
  { name: "Velvet Luxe", code: "bg-gradient-to-r from-red-800 to-purple-900" },
    { name: "Neon Lights", code: "bg-gradient-to-r from-purple-400 via-pink-500 to-red-500" },
    { name: "Stone Path", code: "bg-gradient-to-r from-stone-300 to-stone-500" },
  { name: "Earth Tone", code: "bg-gradient-to-r from-neutral-400 to-neutral-600" },
  { name: "Misty Gray", code: "bg-gradient-to-r from-gray-200 to-gray-400" },
  { name: "Slate Shadow", code: "bg-gradient-to-r from-slate-500 to-slate-700" },
  { name: "Sand Drift", code: "bg-gradient-to-r from-amber-200 to-amber-400" },
  { name: "Pebble Beach", code: "bg-gradient-to-r from-zinc-300 to-zinc-500" },
  { name: "Desert Sage", code: "bg-gradient-to-r from-lime-200 to-lime-400" },
  { name: "Ashen Earth", code: "bg-gradient-to-r from-neutral-500 to-neutral-700" },
  { name: "Weathered Wood", code: "bg-gradient-to-r from-stone-400 to-stone-600" },
  { name: "Dusty Trail", code: "bg-gradient-to-r from-orange-200 to-orange-400" },
  { name: "Neon Burst", code: "bg-gradient-to-r from-pink-500 to-yellow-500" },
  { name: "Electric Slide", code: "bg-gradient-to-r from-green-400 to-blue-500" },
  { name: "Vivid Sunset", code: "bg-gradient-to-r from-red-500 to-yellow-500" },
  { name: "Candy Crush", code: "bg-gradient-to-r from-pink-500 to-purple-500" },
  { name: "Tropical Splash", code: "bg-gradient-to-r from-teal-400 to-green-500" },
  { name: "Rainbow Rush", code: "bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500" },
  { name: "Fireworks", code: "bg-gradient-to-r from-purple-500 to-red-500" },
  { name: "Sunshine", code: "bg-gradient-to-r from-yellow-400 to-orange-500" },
  { name: "Aqua Fresh", code: "bg-gradient-to-r from-cyan-500 to-blue-500" },
  { name: "Lime Twist", code: "bg-gradient-to-r from-green-500 to-lime-500" },
  { name: "Bubblegum", code: "bg-gradient-to-r from-pink-400 to-pink-600" },
  { name: "Deep Space", code: "bg-gradient-to-r from-indigo-500 to-purple-600" },
  { name: "Summer Heat", code: "bg-gradient-to-r from-red-400 to-orange-500" },
  { name: "Ocean Drive", code: "bg-gradient-to-r from-teal-500 to-cyan-500" },
  { name: "Jungle Fever", code: "bg-gradient-to-r from-green-500 to-teal-500" },
  { name: "Hot Pink", code: "bg-gradient-to-r from-pink-500 to-red-500" },
  { name: "Lemon Lime", code: "bg-gradient-to-r from-yellow-500 to-green-500" },
  { name: "Azure Skies", code: "bg-gradient-to-r from-blue-400 to-blue-600" },
  { name: "Flamingo", code: "bg-gradient-to-r from-pink-500 to-orange-500" },
  { name: "Citrus Burst", code: "bg-gradient-to-r from-orange-400 to-yellow-500" },
  {
    name: "Unicorn Magic",
    code: "bg-gradient-to-r from-pink-500 via-purple-500 via-indigo-500 via-blue-500 via-green-500 via-yellow-500 via-red-500 to-pink-500"
  },
  {
    name: "Prismatic Spectacle",
    code: "bg-gradient-to-bl from-fuchsia-500 via-orange-400 via-yellow-300 via-green-200 via-blue-300 via-indigo-400 via-purple-500 to-pink-500"
  },
  {
    name: "Aurora Unicornis",
    code: "bg-gradient-to-r from-pink-400 via-purple-400 via-blue-400 via-green-400 via-yellow-400 via-red-400 to-pink-400"
  },
  {
    name: "Ethereal Rainbow",
    code: "bg-gradient-to-r from-red-400 via-yellow-400 via-green-400 via-blue-400 via-indigo-400 via-purple-400 via-pink-400 to-red-400"
  },
  { name: "Neon Pulse", code: "bg-gradient-to-r from-blue-400 to-indigo-600" },
{ name: "Chic Blush", code: "bg-gradient-to-r from-pink-300 to-purple-500" },
{ name: "Radiant Orchid", code: "bg-gradient-to-r from-purple-300 to-pink-500" },
{ name: "Vibrant Green", code: "bg-gradient-to-r from-green-400 to-teal-500" },
{ name: "Playful Rainbow", code: "bg-gradient-to-r from-red-400 to-yellow-400" },
{ name: "Fresh Greens", code: "bg-gradient-to-r from-lime-300 to-green-400" },
{ name: "Ocean Breeze", code: "bg-gradient-to-r from-cyan-400 to-blue-500" },
{ name: "Literary Escape", code: "bg-gradient-to-r from-teal-300 to-blue-400" },
{ name: "Metallic Shine", code: "bg-gradient-to-r from-gray-400 to-gray-600" },
{ name: "Luxe Gold", code: "bg-gradient-to-r from-yellow-400 to-yellow-500" },
{ name: "Digital Night", code: "bg-gradient-to-r from-purple-500 to-blue-600" },
{ name: "Tropical Sunset", code: "bg-gradient-to-r from-orange-400 to-pink-500" },
{ name: "Rustic Autumn", code: "bg-gradient-to-r from-red-600 to-brown-400" },
{ name: "Cool Breeze", code: "bg-gradient-to-r from-sky-300 to-blue-400" },
{ name: "Vintage Rose", code: "bg-gradient-to-r from-rose-300 to-rose-500" },
{ name: "Sunrise Hues", code: "bg-gradient-to-r from-yellow-300 to-orange-400" },
{ name: "Frosty Mint", code: "bg-gradient-to-r from-teal-200 to-teal-400" },
{ name: "Icy Blue", code: "bg-gradient-to-r from-blue-200 to-blue-400" },
{ name: "Mystic Purple", code: "bg-gradient-to-r from-indigo-500 to-purple-600" },
{ name: "Serene Sky", code: "bg-gradient-to-r from-blue-300 to-blue-500" },
{ name: "Gentle Lavender", code: "bg-gradient-to-r from-purple-200 to-purple-400" },
{ name: "Warm Sand", code: "bg-gradient-to-r from-yellow-200 to-yellow-400" },
{ name: "Soft Mint", code: "bg-gradient-to-r from-green-200 to-green-400" },
{ name: "Classic Grey", code: "bg-gradient-to-r from-gray-300 to-gray-500" },
{ name: "Peachy Dream", code: "bg-gradient-to-r from-pink-200 to-pink-400" },
{ name: "Cool Ocean", code: "bg-gradient-to-r from-cyan-200 to-cyan-400" },
{ name: "Muted Coral", code: "bg-gradient-to-r from-red-200 to-red-400" },
{ name: "Subtle Peach", code: "bg-gradient-to-r from-orange-200 to-orange-400" },
{ name: "Earthy Olive", code: "bg-gradient-to-r from-green-300 to-green-500" },
{ name: "Dusky Rose", code: "bg-gradient-to-r from-rose-200 to-rose-400" },
{ name: "Calm Aqua", code: "bg-gradient-to-r from-teal-200 to-teal-400" },
{ name: "Elegant Charcoal", code: "bg-gradient-to-r from-gray-400 to-gray-600" },
{ name: "Sunny Lemon", code: "bg-gradient-to-r from-yellow-100 to-yellow-300" },
{ name: "Fresh Basil", code: "bg-gradient-to-r from-green-100 to-green-300" },
{ name: "Soft Blue", code: "bg-gradient-to-r from-sky-200 to-sky-400" },
{ name: "Pale Lavender", code: "bg-gradient-to-r from-purple-100 to-purple-300" },
{ name: "Light Cherry", code: "bg-gradient-to-r from-red-100 to-red-300" },
{ name: "Warm Beige", code: "bg-gradient-to-r from-yellow-100 to-yellow-200" },
{ name: "Deep Blue", code: "bg-gradient-to-r from-blue-600 to-blue-800" },
{ name: "Rich Purple", code: "bg-gradient-to-r from-purple-500 to-purple-700" },
{ name: "Golden Glow", code: "bg-gradient-to-r from-yellow-500 to-yellow-700" },
{ name: "Forest Green", code: "bg-gradient-to-r from-green-600 to-green-800" },
{ name: "Slate Grey", code: "bg-gradient-to-r from-gray-500 to-gray-700" },
{ name: "Crimson Red", code: "bg-gradient-to-r from-red-600 to-red-800" },
{ name: "Tangerine", code: "bg-gradient-to-r from-orange-400 to-orange-600" },
{ name: "Teal Depth", code: "bg-gradient-to-r from-teal-500 to-teal-700" },
{ name: "Berry Bliss", code: "bg-gradient-to-r from-pink-500 to-pink-700" },
{ name: "Cool Cyan", code: "bg-gradient-to-r from-cyan-500 to-cyan-700" },
{ name: "Mellow Peach", code: "bg-gradient-to-r from-orange-300 to-orange-500" },
{ name: "Royal Blue", code: "bg-gradient-to-r from-indigo-500 to-indigo-700" },
{ name: "Soft Lavender", code: "bg-gradient-to-r from-purple-300 to-purple-500" },
{ name: "Bright Lemon", code: "bg-gradient-to-r from-yellow-400 to-yellow-600" },
{ name: "Calming Mint", code: "bg-gradient-to-r from-green-400 to-green-600" },
{ name: "Rusty Red", code: "bg-gradient-to-r from-red-500 to-red-700" },
{ name: "Ocean Blue", code: "bg-gradient-to-r from-blue-400 to-blue-600" },
{ name: "Vintage Rose", code: "bg-gradient-to-r from-rose-400 to-rose-600" },
{ name: "Joyful Sunrise", code: "bg-gradient-to-r from-yellow-300 to-orange-400" },
{ name: "Calm Serenity", code: "bg-gradient-to-r from-blue-200 to-blue-400" },
{ name: "Passionate Love", code: "bg-gradient-to-r from-red-400 to-red-600" },
{ name: "Refreshing Breeze", code: "bg-gradient-to-r from-teal-300 to-teal-500" },
{ name: "Warm Embrace", code: "bg-gradient-to-r from-pink-300 to-pink-500" },
{ name: "Mystical Night", code: "bg-gradient-to-r from-indigo-400 to-indigo-600" },
{ name: "Hopeful Green", code: "bg-gradient-to-r from-green-300 to-green-500" },
{ name: "Dreamy Lavender", code: "bg-gradient-to-r from-purple-300 to-purple-500" },
{ name: "Energetic Vibe", code: "bg-gradient-to-r from-orange-400 to-yellow-500" },
{ name: "Tranquil Escape", code: "bg-gradient-to-r from-blue-300 to-purple-400" },
{ name: "Reflective Mood", code: "bg-gradient-to-r from-gray-300 to-gray-500" },
{ name: "Nostalgic Gold", code: "bg-gradient-to-r from-yellow-400 to-brown-400" },
{ name: "Adventurous Spirit", code: "bg-gradient-to-r from-cyan-400 to-blue-500" },
{ name: "Gentle Bliss", code: "bg-gradient-to-r from-rose-300 to-rose-500" },
{ name: "Focused Mind", code: "bg-gradient-to-r from-green-500 to-green-700" },
{ name: "Cheerful Vibes", code: "bg-gradient-to-r from-pink-400 to-orange-400" },
{ name: "Introspective Calm", code: "bg-gradient-to-r from-blue-500 to-indigo-500" },
{ name: "Radiant Optimism", code: "bg-gradient-to-r from-yellow-500 to-orange-300" },
{ name: "Sincere Comfort", code: "bg-gradient-to-r from-green-200 to-green-400" },
{ name: "Chilled Relaxation", code: "bg-gradient-to-r from-gray-200 to-gray-400" },
{ name: "Zesty Lemon", code: "bg-gradient-to-r from-yellow-300 to-yellow-500" },
{ name: "Spicy Chili", code: "bg-gradient-to-r from-red-400 to-red-600" },
{ name: "Savory Olive", code: "bg-gradient-to-r from-green-400 to-green-600" },
{ name: "Sweet Berry", code: "bg-gradient-to-r from-purple-300 to-purple-500" },
{ name: "Fresh Mint", code: "bg-gradient-to-r from-teal-300 to-teal-500" },
{ name: "Tart Raspberry", code: "bg-gradient-to-r from-pink-400 to-pink-600" },
{ name: "Fruity Mango", code: "bg-gradient-to-r from-yellow-400 to-orange-400" },
{ name: "Herbaceous Basil", code: "bg-gradient-to-r from-green-200 to-green-400" },
{ name: "Caramel Drizzle", code: "bg-gradient-to-r from-orange-300 to-yellow-500" },
{ name: "Juicy Watermelon", code: "bg-gradient-to-r from-green-400 to-pink-400" },
{ name: "Delicate Chamomile", code: "bg-gradient-to-r from-yellow-200 to-white" },
{ name: "Smoky BBQ", code: "bg-gradient-to-r from-red-500 to-brown-500" },
{ name: "Earthy Beetroot", code: "bg-gradient-to-r from-red-600 to-purple-500" },
{ name: "Funky Ferments", code: "bg-gradient-to-r from-purple-200 to-purple-400" },
{ name: "Golden Honey", code: "bg-gradient-to-r from-yellow-300 to-brown-300" },
{ name: "Creamy Coconut", code: "bg-gradient-to-r from-white to-yellow-100" },
{ name: "Mint Chocolate Chip", code: "bg-gradient-to-r from-teal-400 to-green-400" },
{ name: "Strawberry Swirl", code: "bg-gradient-to-r from-pink-400 to-red-500" },
{ name: "Vanilla Bean", code: "bg-gradient-to-r from-yellow-50 to-yellow-200" },
{ name: "Lemon Sorbet", code: "bg-gradient-to-r from-yellow-300 to-yellow-500" },
{ name: "Blueberry Bliss", code: "bg-gradient-to-r from-blue-400 to-indigo-500" },
{ name: "Peach Melba", code: "bg-gradient-to-r from-orange-300 to-pink-300" },
{ name: "Pistachio Delight", code: "bg-gradient-to-r from-green-300 to-green-500" },
{ name: "Raspberry Ripple", code: "bg-gradient-to-r from-red-400 to-pink-500" },
{ name: "Cookie Dough", code: "bg-gradient-to-r from-yellow-200 to-yellow-300" },
{ name: "Tropical Coconut", code: "bg-gradient-to-r from-white to-teal-200" },
{ name: "Classic Chocolate", code: "bg-gradient-to-r from-gray-900 to-gray-700" },
{ name: "Honey Lavender", code: "bg-gradient-to-r from-yellow-300 to-purple-300" },
{ name: "Mango Tango", code: "bg-gradient-to-r from-orange-400 to-yellow-400" },
{ name: "Cherry Jubilee", code: "bg-gradient-to-r from-red-500 to-pink-400" },
{ name: "Matcha Green Tea", code: "bg-gradient-to-r from-green-400 to-green-600" },
{ name: "Grapefruit Sorbet", code: "bg-gradient-to-r from-pink-300 to-orange-300" },
{ name: "Pineapple Paradise", code: "bg-gradient-to-r from-yellow-200 to-yellow-400" },
{ name: "Berry Medley", code: "bg-gradient-to-r from-purple-300 to-pink-500" },
{ name: "Vanilla Berry", code: "bg-gradient-to-r from-yellow-50 to-purple-400" },
{ name: "S'mores Delight", code: "bg-gradient-to-r from-yellow-200 to-orange-200" },
{ name: "Elegant Black", code: "bg-gradient-to-r from-gray-800 to-gray-900" },
{ name: "Chic Blush", code: "bg-gradient-to-r from-pink-300 to-pink-500" },
{ name: "Classic Denim", code: "bg-gradient-to-r from-blue-400 to-blue-600" },
{ name: "Bold Red", code: "bg-gradient-to-r from-red-500 to-red-700" },
{ name: "Trendy Olive", code: "bg-gradient-to-r from-green-500 to-green-700" },
{ name: "Feminine Lavender", code: "bg-gradient-to-r from-purple-300 to-purple-500" },
{ name: "Soft Taupe", code: "bg-gradient-to-r from-gray-300 to-gray-500" },
{ name: "Bright Coral", code: "bg-gradient-to-r from-orange-400 to-red-400" },
{ name: "Navy Chic", code: "bg-gradient-to-r from-blue-700 to-blue-800" },
{ name: "Sunny Yellow", code: "bg-gradient-to-r from-yellow-400 to-yellow-500" },
{ name: "Classic Ivory", code: "bg-gradient-to-r from-white to-gray-100" },
{ name: "Warm Terracotta", code: "bg-gradient-to-r from-orange-500 to-red-500" },
{ name: "Casual Grey", code: "bg-gradient-to-r from-gray-400 to-gray-600" },
{ name: "Frosty Mint", code: "bg-gradient-to-r from-teal-300 to-teal-500" },
{ name: "Rugged Khaki", code: "bg-gradient-to-r from-yellow-200 to-yellow-300" },
{ name: "Urban Charcoal", code: "bg-gradient-to-r from-gray-700 to-gray-900" },
{ name: "Lively Aqua", code: "bg-gradient-to-r from-cyan-400 to-cyan-600" },
{ name: "Daring Berry", code: "bg-gradient-to-r from-purple-400 to-purple-600" },
{ name: "Polished Silver", code: "bg-gradient-to-r from-gray-300 to-gray-500" },
{ name: "Vibrant Fuchsia", code: "bg-gradient-to-r from-pink-500 to-pink-700" },
{ name: "Whimsical Rainbow", code: "bg-gradient-to-r from-red-400 to-yellow-400" },
{ name: "Magical Unicorn", code: "bg-gradient-to-r from-pink-300 to-purple-500" },
{ name: "Starry Night", code: "bg-gradient-to-r from-indigo-400 to-blue-600" },
{ name: "Sunny Daydream", code: "bg-gradient-to-r from-yellow-300 to-orange-400" },
{ name: "Adventure Green", code: "bg-gradient-to-r from-green-300 to-green-500" },
{ name: "Fairy Tale Pink", code: "bg-gradient-to-r from-rose-300 to-rose-500" },
{ name: "Ocean Dreams", code: "bg-gradient-to-r from-teal-400 to-blue-500" },
{ name: "Enchanted Forest", code: "bg-gradient-to-r from-green-400 to-green-700" },
{ name: "Daring Explorer", code: "bg-gradient-to-r from-orange-300 to-red-400" },
{ name: "Cloudy Skies", code: "bg-gradient-to-r from-blue-200 to-blue-400" },
{ name: "Gentle Sunset", code: "bg-gradient-to-r from-orange-200 to-pink-300" },
{ name: "Silly Circus", code: "bg-gradient-to-r from-red-500 to-yellow-500" },
{ name: "Adventure Awaits", code: "bg-gradient-to-r from-blue-500 to-indigo-600" },
{ name: "Mystical Lavender", code: "bg-gradient-to-r from-purple-300 to-purple-500" },
{ name: "Candy Land", code: "bg-gradient-to-r from-pink-400 to-yellow-400" },
{ name: "Brave Knight", code: "bg-gradient-to-r from-indigo-500 to-blue-500" },
{ name: "Cozy Campfire", code: "bg-gradient-to-r from-orange-400 to-red-500" },
{ name: "Dreamy Clouds", code: "bg-gradient-to-r from-white to-blue-100" },
{ name: "Sailing Away", code: "bg-gradient-to-r from-teal-300 to-cyan-400" },
{ name: "Joyful Play", code: "bg-gradient-to-r from-yellow-200 to-yellow-400" },
{ name: "Happy Meadow", code: "bg-gradient-to-r from-green-200 to-green-400" },
{ name: "Mars Red", code: "bg-gradient-to-r from-red-600 to-red-800" },
{ name: "Earth Blue", code: "bg-gradient-to-r from-blue-500 to-green-500" },
{ name: "Jupiter Storm", code: "bg-gradient-to-r from-orange-400 to-brown-500" },
{ name: "Venus Glow", code: "bg-gradient-to-r from-yellow-300 to-orange-300" },
{ name: "Neptune Deep", code: "bg-gradient-to-r from-blue-700 to-indigo-800" },
{ name: "Uranus Mist", code: "bg-gradient-to-r from-teal-400 to-blue-500" },
{ name: "Mercury Grey", code: "bg-gradient-to-r from-gray-500 to-gray-700" },
{ name: "Pluto Frost", code: "bg-gradient-to-r from-purple-200 to-gray-400" },
{ name: "Titan Orange", code: "bg-gradient-to-r from-orange-200 to-orange-400" },
{ name: "Lunar Night", code: "bg-gradient-to-r from-gray-600 to-gray-800" },
{ name: "Solar Flare", code: "bg-gradient-to-r from-yellow-400 to-red-400" },
{ name: "Andromeda Blue", code: "bg-gradient-to-r from-blue-300 to-indigo-600" },
{ name: "Galaxy Purple", code: "bg-gradient-to-r from-purple-500 to-indigo-700" },
{ name: "Starry Sky", code: "bg-gradient-to-r from-black to-blue-800" },
{ name: "Comet Tail", code: "bg-gradient-to-r from-white to-blue-200" },
{ name: "Asteroid Dust", code: "bg-gradient-to-r from-gray-400 to-brown-400" },
{ name: "Meteor Shower", code: "bg-gradient-to-r from-yellow-300 to-white" },
{ name: "Nebula Dream", code: "bg-gradient-to-r from-purple-300 to-pink-500" },
{ name: "Orbital Path", code: "bg-gradient-to-r from-blue-500 to-teal-500" },
{ name: "Eclipse Shadow", code: "bg-gradient-to-r from-black to-gray-900" },
{ name: "January Frost", code: "bg-gradient-to-r from-blue-200 to-blue-400" },
{ name: "February Love", code: "bg-gradient-to-r from-pink-400 to-red-500" },
{ name: "March Bloom", code: "bg-gradient-to-r from-green-300 to-green-500" },
{ name: "April Showers", code: "bg-gradient-to-r from-blue-300 to-gray-400" },
{ name: "May Blossom", code: "bg-gradient-to-r from-purple-300 to-yellow-400" },
{ name: "June Sunshine", code: "bg-gradient-to-r from-yellow-300 to-orange-400" },
{ name: "July Heat", code: "bg-gradient-to-r from-red-400 to-orange-500" },
{ name: "August Vibes", code: "bg-gradient-to-r from-orange-300 to-yellow-500" },
{ name: "September Hues", code: "bg-gradient-to-r from-green-500 to-yellow-300" },
{ name: "October Harvest", code: "bg-gradient-to-r from-orange-500 to-red-600" },
{ name: "November Chill", code: "bg-gradient-to-r from-gray-300 to-gray-500" },
{ name: "December Glow", code: "bg-gradient-to-r from-red-600 to-green-600" },
{ name: "Spring Awakening", code: "bg-gradient-to-r from-pink-200 to-green-300" },
{ name: "Summer Breeze", code: "bg-gradient-to-r from-yellow-400 to-cyan-400" },
{ name: "Autumn Leaves", code: "bg-gradient-to-r from-orange-400 to-brown-500" },
{ name: "Winter Wonderland", code: "bg-gradient-to-r from-white to-blue-200" },
{ name: "Festive Cheer", code: "bg-gradient-to-r from-red-500 to-gold-400" },
{ name: "Season of Growth", code: "bg-gradient-to-r from-green-400 to-yellow-400" },
{ name: "Nature’s Palette", code: "bg-gradient-to-r from-green-500 to-brown-300" },
{ name: "Helen Left...", code: "bg-gradient-to-r from-purple-400 to-blue-600" },

  
  ]
  const handleCopy = async (code: string, index: number) => {
    // Free users -> show premium modal
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }

    try {
      await navigator.clipboard.writeText(code);

      setCopiedIndex(index);

      setTimeout(() => {
        setCopiedIndex(null);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy gradient:", error);
    }
  };

  const handleSave = async (
    gradient: { name: string; code: string },
    index: number
  ) => {
    // Free users -> show premium modal
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }

    setSavingIndex(index);

    try {
      const response = await fetch("/api/save-gradient", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(gradient),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save gradient");
      }
    } catch (error) {
      console.error("Failed to save gradient:", error);
    } finally {
      setSavingIndex(null);
    }
  };

  const handleCardClick = () => {
    if (!isPremium) {
      setShowPremiumModal(true);
    }
  };

  return (
    <>
      <section>
        <div className="grid grid-cols-1 gap-9 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {gradients.map((gradient, index) => (
            <Card
              key={index}
              onClick={handleCardClick}
              className={`
                group relative overflow-hidden
                transition-all duration-200
                ${!isPremium ? "cursor-pointer" : ""}
              `}
            >
              {/* Gradient Preview */}
              <CardHeader
                className={`h-32 ${gradient.code}`}
              />

              {/* Gradient Name */}
              <CardContent>
                <CardTitle className="mt-2 text-xs text-gray-800">
                  {gradient.name}
                </CardTitle>
              </CardContent>

              {/* Lock for free users */}
              {!isPremium && (
                <div
                  className="
                    absolute bottom-3 right-3 z-20
                    flex h-7 w-7
                    items-center justify-center
                    rounded-full
                    bg-black/70
                    text-white
                    shadow-md
                    transition-transform duration-200
                    group-hover:scale-105
                  "
                >
                  <Lock className="h-3.5 w-3.5" />
                </div>
              )}

              {/* Hover Actions */}
              <div
                className="
                  absolute inset-0
                  flex items-center justify-center
                  bg-black/60
                  opacity-0
                  transition-opacity
                  group-hover:opacity-100
                "
              >
                <div className="flex space-x-2">
                  {/* Copy */}
                  <Button
                    onClick={(event) => {
                      event.stopPropagation();
                      handleCopy(gradient.code, index);
                    }}
                    variant="secondary"
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    {copiedIndex === index ? (
                      "Copied!"
                    ) : (
                      <>
                        <ClipboardCopyIcon className="h-4 w-4" />
                        <span>Copy</span>
                      </>
                    )}
                  </Button>

                  {/* Save */}
                  <Button
                    onClick={(event) => {
                      event.stopPropagation();
                      handleSave(gradient, index);
                    }}
                    variant="secondary"
                    size="sm"
                    className="flex items-center space-x-2"
                    disabled={savingIndex === index}
                  >
                    {savingIndex === index ? (
                      "Saving..."
                    ) : (
                      <>
                        <SaveIcon className="h-4 w-4" />
                        <span>Save</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Premium Modal */}
      <PremiumRequiredModal
        open={showPremiumModal}
        onOpenChange={setShowPremiumModal}
      />
    </>
  );
}

