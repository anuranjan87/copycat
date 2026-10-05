
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Header from "@/components/header2";
import {
  LayoutTemplate,
  Lock,
  PlayIcon,
  PencilIcon,
  ImageIcon,
  CloudIcon,
  LogInIcon,
  LayoutIcon,
  PaletteIcon,
  BoneIcon,
} from "lucide-react";

import { useSubscription } from "@/components/subscription-provider";
import PremiumRequiredModal from "@/components/ui_components/PremiumRequiredModal";
export default function ColorPalette() {
  const [copyFormat, setCopyFormat] = useState("HEX");
  const { isPremium } = useSubscription();
    const [showPremiumModal, setShowPremiumModal] = useState(false);

const handleColorClick = (color: string, shade: string) => {
  if (!isPremium) {
    setShowPremiumModal(true);
    return;
  }

  handleColorClick(color, shade);
};
  const copyToClipboard = (color: string, shade: string) => {
    let textToCopy = "";

    switch (copyFormat) {
      case "HEX":
        textToCopy = `#${color}${shade}`;
        break;

      case "RGB":
        // Placeholder. Add HEX → RGB conversion here if needed.
        textToCopy = `rgb(0, 0, 0)`;
        break;

      case "HSL":
        // Placeholder. Add HEX → HSL conversion here if needed.
        textToCopy = `hsl(0, 0%, 0%)`;
        break;

      case "Tailwind":
        textToCopy = `${color.toLowerCase()}-${shade}`;
        break;
    }

    navigator.clipboard.writeText(textToCopy);
  };

  const renderLock = () => {
    if (isPremium) return null;

    return (
      <div className="pointer-events-none absolute bottom-3 right-3 z-30 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white opacity-0 shadow-md transition-opacity duration-200 group-hover:opacity-100">
        <Lock className="h-3.5 w-3.5" />
      </div>
    );
  };


  return (
    <>
      <div>
        <div
          className="container mx-auto mb-11 mt-9 p-9"
          style={{ zoom: "0.76" }}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

            {/* RED */}
            <div className="group relative overflow-hidden rounded-lg bg-white shadow-md">
              {renderLock()}

              <div className="bg-gray-100 p-4">
                <h2 className="text-lg font-semibold">Red</h2>
              </div>

              <div className="grid grid-cols-1">
                <button
                  className="h-12 w-full bg-red-50 transition-opacity hover:opacity-90"
                  onClick={() => handleColorClick("red", "50")}
                />
                <button
                  className="h-12 w-full bg-red-100 transition-opacity hover:opacity-90"
                  onClick={() => handleColorClick("red", "100")}
                />
                <button
                  className="h-12 w-full bg-red-200 transition-opacity hover:opacity-90"
                  onClick={() => handleColorClick("red", "200")}
                />
                <button
                  className="h-12 w-full bg-red-300 transition-opacity hover:opacity-90"
                  onClick={() => handleColorClick("red", "300")}
                />
                <button
                  className="h-12 w-full bg-red-400 transition-opacity hover:opacity-90"
                  onClick={() => handleColorClick("red", "400")}
                />
                <button
                  className="h-12 w-full bg-red-500 transition-opacity hover:opacity-90"
                  onClick={() => handleColorClick("red", "500")}
                />
                <button
                  className="h-12 w-full bg-red-600 transition-opacity hover:opacity-90"
                  onClick={() => handleColorClick("red", "600")}
                />
                <button
                  className="h-12 w-full bg-red-700 transition-opacity hover:opacity-90"
                  onClick={() => handleColorClick("red", "700")}
                />
                <button
                  className="h-12 w-full bg-red-800 transition-opacity hover:opacity-90"
                  onClick={() => handleColorClick("red", "800")}
                />
                <button
                  className="h-12 w-full bg-red-900 transition-opacity hover:opacity-90"
                  onClick={() => handleColorClick("red", "900")}
                />
                <button
                  className="h-12 w-full bg-red-950 transition-opacity hover:opacity-90"
                  onClick={() => handleColorClick("red", "950")}
                />
              </div>
            </div>

            {/* ORANGE */}
            <div className="group relative overflow-hidden rounded-lg bg-white shadow-md">
              {renderLock()}

              <div className="bg-gray-100 p-4">
                <h2 className="text-lg font-semibold">Orange</h2>
              </div>

              <div className="grid grid-cols-1">
                <button
                  className="h-12 w-full bg-orange-50 transition-opacity hover:opacity-90"
                  onClick={() => handleColorClick("orange", "50")}
                />
                <button
                  className="h-12 w-full bg-orange-100 transition-opacity hover:opacity-90"
                  onClick={() => handleColorClick("orange", "100")}
                />
                <button
                  className="h-12 w-full bg-orange-200 transition-opacity hover:opacity-90"
                  onClick={() => handleColorClick("orange", "200")}
                />
                <button
                  className="h-12 w-full bg-orange-300 transition-opacity hover:opacity-90"
                  onClick={() => handleColorClick("orange", "300")}
                />
                <button
                  className="h-12 w-full bg-orange-400 transition-opacity hover:opacity-90"
                  onClick={() => handleColorClick("orange", "400")}
                />
                <button
                  className="h-12 w-full bg-orange-500 transition-opacity hover:opacity-90"
                  onClick={() => handleColorClick("orange", "500")}
                />
                <button
                  className="h-12 w-full bg-orange-600 transition-opacity hover:opacity-90"
                  onClick={() => handleColorClick("orange", "600")}
                />
                <button
                  className="h-12 w-full bg-orange-700 transition-opacity hover:opacity-90"
                  onClick={() => handleColorClick("orange", "700")}
                />
                <button
                  className="h-12 w-full bg-orange-800 transition-opacity hover:opacity-90"
                  onClick={() => handleColorClick("orange", "800")}
                />
                <button
                  className="h-12 w-full bg-orange-900 transition-opacity hover:opacity-90"
                  onClick={() => handleColorClick("orange", "900")}
                />
                <button
                  className="h-12 w-full bg-orange-950 transition-opacity hover:opacity-90"
                  onClick={() => handleColorClick("orange", "950")}
                />
              </div>
            </div>

            {/* AMBER */}
            <div className="group relative overflow-hidden rounded-lg bg-white shadow-md">
              {renderLock()}

              <div className="bg-gray-100 p-4">
                <h2 className="text-lg font-semibold">Amber</h2>
              </div>

              <div className="grid grid-cols-1">
                <button
                  className="h-12 w-full bg-amber-50 transition-opacity hover:opacity-90"
                  onClick={() => handleColorClick("amber", "50")}
                />
                <button
                  className="h-12 w-full bg-amber-100 transition-opacity hover:opacity-90"
                  onClick={() => handleColorClick("amber", "100")}
                />
                <button
                  className="h-12 w-full bg-amber-200 transition-opacity hover:opacity-90"
                  onClick={() => handleColorClick("amber", "200")}
                />
                <button
                  className="h-12 w-full bg-amber-300 transition-opacity hover:opacity-90"
                  onClick={() => handleColorClick("amber", "300")}
                />
                <button
                  className="h-12 w-full bg-amber-400 transition-opacity hover:opacity-90"
                  onClick={() => handleColorClick("amber", "400")}
                />
                <button
                  className="h-12 w-full bg-amber-500 transition-opacity hover:opacity-90"
                  onClick={() => handleColorClick("amber", "500")}
                />
                <button
                  className="h-12 w-full bg-amber-600 transition-opacity hover:opacity-90"
                  onClick={() => handleColorClick("amber", "600")}
                />
                <button
                  className="h-12 w-full bg-amber-700 transition-opacity hover:opacity-90"
                  onClick={() => handleColorClick("amber", "700")}
                />
                <button
                  className="h-12 w-full bg-amber-800 transition-opacity hover:opacity-90"
                  onClick={() => handleColorClick("amber", "800")}
                />
                <button
                  className="h-12 w-full bg-amber-900 transition-opacity hover:opacity-90"
                  onClick={() => handleColorClick("amber", "900")}
                />
                <button
                  className="h-12 w-full bg-amber-950 transition-opacity hover:opacity-90"
                  onClick={() => handleColorClick("amber", "950")}
                />
              </div>
            </div>

            {/* YELLOW */}
            <div className="group relative overflow-hidden rounded-lg bg-white shadow-md">
              {renderLock()}

              <div className="bg-gray-100 p-4">
                <h2 className="text-lg font-semibold">Yellow</h2>
              </div>

              <div className="grid grid-cols-1">
                <button
                  className="h-12 w-full bg-yellow-50 transition-opacity hover:opacity-90"
                  onClick={() => handleColorClick("yellow", "50")}
                />
                <button
                  className="h-12 w-full bg-yellow-100 transition-opacity hover:opacity-90"
                  onClick={() => handleColorClick("yellow", "100")}
                />
                <button
                  className="h-12 w-full bg-yellow-200 transition-opacity hover:opacity-90"
                  onClick={() => handleColorClick("yellow", "200")}
                />
                <button
                  className="h-12 w-full bg-yellow-300 transition-opacity hover:opacity-90"
                  onClick={() => handleColorClick("yellow", "300")}
                />
                <button
                  className="h-12 w-full bg-yellow-400 transition-opacity hover:opacity-90"
                  onClick={() => handleColorClick("yellow", "400")}
                />
                <button
                  className="h-12 w-full bg-yellow-500 transition-opacity hover:opacity-90"
                  onClick={() => handleColorClick("yellow", "500")}
                />
                <button
                  className="h-12 w-full bg-yellow-600 transition-opacity hover:opacity-90"
                  onClick={() => handleColorClick("yellow", "600")}
                />
                <button
                  className="h-12 w-full bg-yellow-700 transition-opacity hover:opacity-90"
                  onClick={() => handleColorClick("yellow", "700")}
                />
                <button
                  className="h-12 w-full bg-yellow-800 transition-opacity hover:opacity-90"
                  onClick={() => handleColorClick("yellow", "800")}
                />
                <button
                  className="h-12 w-full bg-yellow-900 transition-opacity hover:opacity-90"
                  onClick={() => handleColorClick("yellow", "900")}
                />
                <button
                  className="h-12 w-full bg-yellow-950 transition-opacity hover:opacity-90"
                  onClick={() => handleColorClick("yellow", "950")}
                />
              </div>
            </div>

            {/* LIME */}
            <div className="group relative overflow-hidden rounded-lg bg-white shadow-md">
              {renderLock()}

              <div className="bg-gray-100 p-4">
                <h2 className="text-lg font-semibold">Lime</h2>
              </div>

              <div className="grid grid-cols-1">
                <button className="h-12 w-full bg-lime-50 transition-opacity hover:opacity-90" onClick={() => handleColorClick("lime", "50")} />
                <button className="h-12 w-full bg-lime-100 transition-opacity hover:opacity-90" onClick={() => handleColorClick("lime", "100")} />
                <button className="h-12 w-full bg-lime-200 transition-opacity hover:opacity-90" onClick={() => handleColorClick("lime", "200")} />
                <button className="h-12 w-full bg-lime-300 transition-opacity hover:opacity-90" onClick={() => handleColorClick("lime", "300")} />
                <button className="h-12 w-full bg-lime-400 transition-opacity hover:opacity-90" onClick={() => handleColorClick("lime", "400")} />
                <button className="h-12 w-full bg-lime-500 transition-opacity hover:opacity-90" onClick={() => handleColorClick("lime", "500")} />
                <button className="h-12 w-full bg-lime-600 transition-opacity hover:opacity-90" onClick={() => handleColorClick("lime", "600")} />
                <button className="h-12 w-full bg-lime-700 transition-opacity hover:opacity-90" onClick={() => handleColorClick("lime", "700")} />
                <button className="h-12 w-full bg-lime-800 transition-opacity hover:opacity-90" onClick={() => handleColorClick("lime", "800")} />
                <button className="h-12 w-full bg-lime-900 transition-opacity hover:opacity-90" onClick={() => handleColorClick("lime", "900")} />
                <button className="h-12 w-full bg-lime-950 transition-opacity hover:opacity-90" onClick={() => handleColorClick("lime", "950")} />
              </div>
            </div>

            {/* GREEN */}
            <div className="group relative overflow-hidden rounded-lg bg-white shadow-md">
              {renderLock()}

              <div className="bg-gray-100 p-4">
                <h2 className="text-lg font-semibold">Green</h2>
              </div>

              <div className="grid grid-cols-1">
                <button className="h-12 w-full bg-green-50 transition-opacity hover:opacity-90" onClick={() => handleColorClick("green", "50")} />
                <button className="h-12 w-full bg-green-100 transition-opacity hover:opacity-90" onClick={() => handleColorClick("green", "100")} />
                <button className="h-12 w-full bg-green-200 transition-opacity hover:opacity-90" onClick={() => handleColorClick("green", "200")} />
                <button className="h-12 w-full bg-green-300 transition-opacity hover:opacity-90" onClick={() => handleColorClick("green", "300")} />
                <button className="h-12 w-full bg-green-400 transition-opacity hover:opacity-90" onClick={() => handleColorClick("green", "400")} />
                <button className="h-12 w-full bg-green-500 transition-opacity hover:opacity-90" onClick={() => handleColorClick("green", "500")} />
                <button className="h-12 w-full bg-green-600 transition-opacity hover:opacity-90" onClick={() => handleColorClick("green", "600")} />
                <button className="h-12 w-full bg-green-700 transition-opacity hover:opacity-90" onClick={() => handleColorClick("green", "700")} />
                <button className="h-12 w-full bg-green-800 transition-opacity hover:opacity-90" onClick={() => handleColorClick("green", "800")} />
                <button className="h-12 w-full bg-green-900 transition-opacity hover:opacity-90" onClick={() => handleColorClick("green", "900")} />
                <button className="h-12 w-full bg-green-950 transition-opacity hover:opacity-90" onClick={() => handleColorClick("green", "950")} />
              </div>
            </div>

            {/* TEAL */}
            <div className="group relative overflow-hidden rounded-lg bg-white shadow-md">
              {renderLock()}

              <div className="bg-gray-100 p-4">
                <h2 className="text-lg font-semibold">Teal</h2>
              </div>

              <div className="grid grid-cols-1">
                <button className="h-12 w-full bg-teal-50 transition-opacity hover:opacity-90" onClick={() => handleColorClick("teal", "50")} />
                <button className="h-12 w-full bg-teal-100 transition-opacity hover:opacity-90" onClick={() => handleColorClick("teal", "100")} />
                <button className="h-12 w-full bg-teal-200 transition-opacity hover:opacity-90" onClick={() => handleColorClick("teal", "200")} />
                <button className="h-12 w-full bg-teal-300 transition-opacity hover:opacity-90" onClick={() => handleColorClick("teal", "300")} />
                <button className="h-12 w-full bg-teal-400 transition-opacity hover:opacity-90" onClick={() => handleColorClick("teal", "400")} />
                <button className="h-12 w-full bg-teal-500 transition-opacity hover:opacity-90" onClick={() => handleColorClick("teal", "500")} />
                <button className="h-12 w-full bg-teal-600 transition-opacity hover:opacity-90" onClick={() => handleColorClick("teal", "600")} />
                <button className="h-12 w-full bg-teal-700 transition-opacity hover:opacity-90" onClick={() => handleColorClick("teal", "700")} />
                <button className="h-12 w-full bg-teal-800 transition-opacity hover:opacity-90" onClick={() => handleColorClick("teal", "800")} />
                <button className="h-12 w-full bg-teal-900 transition-opacity hover:opacity-90" onClick={() => handleColorClick("teal", "900")} />
                <button className="h-12 w-full bg-teal-950 transition-opacity hover:opacity-90" onClick={() => handleColorClick("teal", "950")} />
              </div>
            </div>

            {/* CYAN */}
            <div className="group relative overflow-hidden rounded-lg bg-white shadow-md">
              {renderLock()}

              <div className="bg-gray-100 p-4">
                <h2 className="text-lg font-semibold">Cyan</h2>
              </div>

              <div className="grid grid-cols-1">
                <button className="h-12 w-full bg-cyan-50 transition-opacity hover:opacity-90" onClick={() => handleColorClick("cyan", "50")} />
                <button className="h-12 w-full bg-cyan-100 transition-opacity hover:opacity-90" onClick={() => handleColorClick("cyan", "100")} />
                <button className="h-12 w-full bg-cyan-200 transition-opacity hover:opacity-90" onClick={() => handleColorClick("cyan", "200")} />
                <button className="h-12 w-full bg-cyan-300 transition-opacity hover:opacity-90" onClick={() => handleColorClick("cyan", "300")} />
                <button className="h-12 w-full bg-cyan-400 transition-opacity hover:opacity-90" onClick={() => handleColorClick("cyan", "400")} />
                <button className="h-12 w-full bg-cyan-500 transition-opacity hover:opacity-90" onClick={() => handleColorClick("cyan", "500")} />
                <button className="h-12 w-full bg-cyan-600 transition-opacity hover:opacity-90" onClick={() => handleColorClick("cyan", "600")} />
                <button className="h-12 w-full bg-cyan-700 transition-opacity hover:opacity-90" onClick={() => handleColorClick("cyan", "700")} />
                <button className="h-12 w-full bg-cyan-800 transition-opacity hover:opacity-90" onClick={() => handleColorClick("cyan", "800")} />
                <button className="h-12 w-full bg-cyan-900 transition-opacity hover:opacity-90" onClick={() => handleColorClick("cyan", "900")} />
                <button className="h-12 w-full bg-cyan-950 transition-opacity hover:opacity-90" onClick={() => handleColorClick("cyan", "950")} />
              </div>
            </div>

            {/* SKY */}
            <div className="group relative overflow-hidden rounded-lg bg-white shadow-md">
              {renderLock()}

              <div className="bg-gray-100 p-4">
                <h2 className="text-lg font-semibold">Sky</h2>
              </div>

              <div className="grid grid-cols-1">
                <button className="h-12 w-full bg-sky-50 transition-opacity hover:opacity-90" onClick={() => handleColorClick("sky", "50")} />
                <button className="h-12 w-full bg-sky-100 transition-opacity hover:opacity-90" onClick={() => handleColorClick("sky", "100")} />
                <button className="h-12 w-full bg-sky-200 transition-opacity hover:opacity-90" onClick={() => handleColorClick("sky", "200")} />
                <button className="h-12 w-full bg-sky-300 transition-opacity hover:opacity-90" onClick={() => handleColorClick("sky", "300")} />
                <button className="h-12 w-full bg-sky-400 transition-opacity hover:opacity-90" onClick={() => handleColorClick("sky", "400")} />
                <button className="h-12 w-full bg-sky-500 transition-opacity hover:opacity-90" onClick={() => handleColorClick("sky", "500")} />
                <button className="h-12 w-full bg-sky-600 transition-opacity hover:opacity-90" onClick={() => handleColorClick("sky", "600")} />
                <button className="h-12 w-full bg-sky-700 transition-opacity hover:opacity-90" onClick={() => handleColorClick("sky", "700")} />
                <button className="h-12 w-full bg-sky-800 transition-opacity hover:opacity-90" onClick={() => handleColorClick("sky", "800")} />
                <button className="h-12 w-full bg-sky-900 transition-opacity hover:opacity-90" onClick={() => handleColorClick("sky", "900")} />
                <button className="h-12 w-full bg-sky-950 transition-opacity hover:opacity-90" onClick={() => handleColorClick("sky", "950")} />
              </div>
            </div>

            {/* BLUE */}
            <div className="group relative overflow-hidden rounded-lg bg-white shadow-md">
              {renderLock()}

              <div className="bg-gray-100 p-4">
                <h2 className="text-lg font-semibold">Blue</h2>
              </div>

              <div className="grid grid-cols-1">
                <button className="h-12 w-full bg-blue-50 transition-opacity hover:opacity-90" onClick={() => handleColorClick("blue", "50")} />
                <button className="h-12 w-full bg-blue-100 transition-opacity hover:opacity-90" onClick={() => handleColorClick("blue", "100")} />
                <button className="h-12 w-full bg-blue-200 transition-opacity hover:opacity-90" onClick={() => handleColorClick("blue", "200")} />
                <button className="h-12 w-full bg-blue-300 transition-opacity hover:opacity-90" onClick={() => handleColorClick("blue", "300")} />
                <button className="h-12 w-full bg-blue-400 transition-opacity hover:opacity-90" onClick={() => handleColorClick("blue", "400")} />
                <button className="h-12 w-full bg-blue-500 transition-opacity hover:opacity-90" onClick={() => handleColorClick("blue", "500")} />
                <button className="h-12 w-full bg-blue-600 transition-opacity hover:opacity-90" onClick={() => handleColorClick("blue", "600")} />
                <button className="h-12 w-full bg-blue-700 transition-opacity hover:opacity-90" onClick={() => handleColorClick("blue", "700")} />
                <button className="h-12 w-full bg-blue-800 transition-opacity hover:opacity-90" onClick={() => handleColorClick("blue", "800")} />
                <button className="h-12 w-full bg-blue-900 transition-opacity hover:opacity-90" onClick={() => handleColorClick("blue", "900")} />
                <button className="h-12 w-full bg-blue-950 transition-opacity hover:opacity-90" onClick={() => handleColorClick("blue", "950")} />
              </div>
            </div>

            {/* INDIGO */}
            <div className="group relative overflow-hidden rounded-lg bg-white shadow-md">
              {renderLock()}

              <div className="bg-gray-100 p-4">
                <h2 className="text-lg font-semibold">Indigo</h2>
              </div>

              <div className="grid grid-cols-1">
                <button className="h-12 w-full bg-indigo-50 transition-opacity hover:opacity-90" onClick={() => handleColorClick("indigo", "50")} />
                <button className="h-12 w-full bg-indigo-100 transition-opacity hover:opacity-90" onClick={() => handleColorClick("indigo", "100")} />
                <button className="h-12 w-full bg-indigo-200 transition-opacity hover:opacity-90" onClick={() => handleColorClick("indigo", "200")} />
                <button className="h-12 w-full bg-indigo-300 transition-opacity hover:opacity-90" onClick={() => handleColorClick("indigo", "300")} />
                <button className="h-12 w-full bg-indigo-400 transition-opacity hover:opacity-90" onClick={() => handleColorClick("indigo", "400")} />
                <button className="h-12 w-full bg-indigo-500 transition-opacity hover:opacity-90" onClick={() => handleColorClick("indigo", "500")} />
                <button className="h-12 w-full bg-indigo-600 transition-opacity hover:opacity-90" onClick={() => handleColorClick("indigo", "600")} />
                <button className="h-12 w-full bg-indigo-700 transition-opacity hover:opacity-90" onClick={() => handleColorClick("indigo", "700")} />
                <button className="h-12 w-full bg-indigo-800 transition-opacity hover:opacity-90" onClick={() => handleColorClick("indigo", "800")} />
                <button className="h-12 w-full bg-indigo-900 transition-opacity hover:opacity-90" onClick={() => handleColorClick("indigo", "900")} />
                <button className="h-12 w-full bg-indigo-950 transition-opacity hover:opacity-90" onClick={() => handleColorClick("indigo", "950")} />
              </div>
            </div>

            {/* VIOLET */}
            <div className="group relative overflow-hidden rounded-lg bg-white shadow-md">
              {renderLock()}

              <div className="bg-gray-100 p-4">
                <h2 className="text-lg font-semibold">Violet</h2>
              </div>

              <div className="grid grid-cols-1">
                <button className="h-12 w-full bg-violet-50 transition-opacity hover:opacity-90" onClick={() => handleColorClick("violet", "50")} />
                <button className="h-12 w-full bg-violet-100 transition-opacity hover:opacity-90" onClick={() => handleColorClick("violet", "100")} />
                <button className="h-12 w-full bg-violet-200 transition-opacity hover:opacity-90" onClick={() => handleColorClick("violet", "200")} />
                <button className="h-12 w-full bg-violet-300 transition-opacity hover:opacity-90" onClick={() => handleColorClick("violet", "300")} />
                <button className="h-12 w-full bg-violet-400 transition-opacity hover:opacity-90" onClick={() => handleColorClick("violet", "400")} />
                <button className="h-12 w-full bg-violet-500 transition-opacity hover:opacity-90" onClick={() => handleColorClick("violet", "500")} />
                <button className="h-12 w-full bg-violet-600 transition-opacity hover:opacity-90" onClick={() => handleColorClick("violet", "600")} />
                <button className="h-12 w-full bg-violet-700 transition-opacity hover:opacity-90" onClick={() => handleColorClick("violet", "700")} />
                <button className="h-12 w-full bg-violet-800 transition-opacity hover:opacity-90" onClick={() => handleColorClick("violet", "800")} />
                <button className="h-12 w-full bg-violet-900 transition-opacity hover:opacity-90" onClick={() => handleColorClick("violet", "900")} />
                <button className="h-12 w-full bg-violet-950 transition-opacity hover:opacity-90" onClick={() => handleColorClick("violet", "950")} />
              </div>
            </div>

            {/* PURPLE */}
            <div className="group relative overflow-hidden rounded-lg bg-white shadow-md">
              {renderLock()}

              <div className="bg-gray-100 p-4">
                <h2 className="text-lg font-semibold">Purple</h2>
              </div>

              <div className="grid grid-cols-1">
                <button className="h-12 w-full bg-purple-50 transition-opacity hover:opacity-90" onClick={() => handleColorClick("purple", "50")} />
                <button className="h-12 w-full bg-purple-100 transition-opacity hover:opacity-90" onClick={() => handleColorClick("purple", "100")} />
                <button className="h-12 w-full bg-purple-200 transition-opacity hover:opacity-90" onClick={() => handleColorClick("purple", "200")} />
                <button className="h-12 w-full bg-purple-300 transition-opacity hover:opacity-90" onClick={() => handleColorClick("purple", "300")} />
                <button className="h-12 w-full bg-purple-400 transition-opacity hover:opacity-90" onClick={() => handleColorClick("purple", "400")} />
                <button className="h-12 w-full bg-purple-500 transition-opacity hover:opacity-90" onClick={() => handleColorClick("purple", "500")} />
                <button className="h-12 w-full bg-purple-600 transition-opacity hover:opacity-90" onClick={() => handleColorClick("purple", "600")} />
                <button className="h-12 w-full bg-purple-700 transition-opacity hover:opacity-90" onClick={() => handleColorClick("purple", "700")} />
                <button className="h-12 w-full bg-purple-800 transition-opacity hover:opacity-90" onClick={() => handleColorClick("purple", "800")} />
                <button className="h-12 w-full bg-purple-900 transition-opacity hover:opacity-90" onClick={() => handleColorClick("purple", "900")} />
                <button className="h-12 w-full bg-purple-950 transition-opacity hover:opacity-90" onClick={() => handleColorClick("purple", "950")} />
              </div>
            </div>

            {/* FUCHSIA */}
            <div className="group relative overflow-hidden rounded-lg bg-white shadow-md">
              {renderLock()}

              <div className="bg-gray-100 p-4">
                <h2 className="text-lg font-semibold">Fuchsia</h2>
              </div>

              <div className="grid grid-cols-1">
                <button className="h-12 w-full bg-fuchsia-50 transition-opacity hover:opacity-90" onClick={() => handleColorClick("fuchsia", "50")} />
                <button className="h-12 w-full bg-fuchsia-100 transition-opacity hover:opacity-90" onClick={() => handleColorClick("fuchsia", "100")} />
                <button className="h-12 w-full bg-fuchsia-200 transition-opacity hover:opacity-90" onClick={() => handleColorClick("fuchsia", "200")} />
                <button className="h-12 w-full bg-fuchsia-300 transition-opacity hover:opacity-90" onClick={() => handleColorClick("fuchsia", "300")} />
                <button className="h-12 w-full bg-fuchsia-400 transition-opacity hover:opacity-90" onClick={() => handleColorClick("fuchsia", "400")} />
                <button className="h-12 w-full bg-fuchsia-500 transition-opacity hover:opacity-90" onClick={() => handleColorClick("fuchsia", "500")} />
                <button className="h-12 w-full bg-fuchsia-600 transition-opacity hover:opacity-90" onClick={() => handleColorClick("fuchsia", "600")} />
                <button className="h-12 w-full bg-fuchsia-700 transition-opacity hover:opacity-90" onClick={() => handleColorClick("fuchsia", "700")} />
                <button className="h-12 w-full bg-fuchsia-800 transition-opacity hover:opacity-90" onClick={() => handleColorClick("fuchsia", "800")} />
                <button className="h-12 w-full bg-fuchsia-900 transition-opacity hover:opacity-90" onClick={() => handleColorClick("fuchsia", "900")} />
                <button className="h-12 w-full bg-fuchsia-950 transition-opacity hover:opacity-90" onClick={() => handleColorClick("fuchsia", "950")} />
              </div>
            </div>

            {/* PINK */}
            <div className="group relative overflow-hidden rounded-lg bg-white shadow-md">
              {renderLock()}

              <div className="bg-gray-100 p-4">
                <h2 className="text-lg font-semibold">Pink</h2>
              </div>

              <div className="grid grid-cols-1">
                <button className="h-12 w-full bg-pink-50 transition-opacity hover:opacity-90" onClick={() => handleColorClick("pink", "50")} />
                <button className="h-12 w-full bg-pink-100 transition-opacity hover:opacity-90" onClick={() => handleColorClick("pink", "100")} />
                <button className="h-12 w-full bg-pink-200 transition-opacity hover:opacity-90" onClick={() => handleColorClick("pink", "200")} />
                <button className="h-12 w-full bg-pink-300 transition-opacity hover:opacity-90" onClick={() => handleColorClick("pink", "300")} />
                <button className="h-12 w-full bg-pink-400 transition-opacity hover:opacity-90" onClick={() => handleColorClick("pink", "400")} />
                <button className="h-12 w-full bg-pink-500 transition-opacity hover:opacity-90" onClick={() => handleColorClick("pink", "500")} />
                <button className="h-12 w-full bg-pink-600 transition-opacity hover:opacity-90" onClick={() => handleColorClick("pink", "600")} />
                <button className="h-12 w-full bg-pink-700 transition-opacity hover:opacity-90" onClick={() => handleColorClick("pink", "700")} />
                <button className="h-12 w-full bg-pink-800 transition-opacity hover:opacity-90" onClick={() => handleColorClick("pink", "800")} />
                <button className="h-12 w-full bg-pink-900 transition-opacity hover:opacity-90" onClick={() => handleColorClick("pink", "900")} />
                <button className="h-12 w-full bg-pink-950 transition-opacity hover:opacity-90" onClick={() => handleColorClick("pink", "950")} />
              </div>
            </div>

            {/* ROSE */}
            <div className="group relative overflow-hidden rounded-lg bg-white shadow-md">
              {renderLock()}

              <div className="bg-gray-100 p-4">
                <h2 className="text-lg font-semibold">Rose</h2>
              </div>

              <div className="grid grid-cols-1">
                <button className="h-12 w-full bg-rose-50 transition-opacity hover:opacity-90" onClick={() => handleColorClick("rose", "50")} />
                <button className="h-12 w-full bg-rose-100 transition-opacity hover:opacity-90" onClick={() => handleColorClick("rose", "100")} />
                <button className="h-12 w-full bg-rose-200 transition-opacity hover:opacity-90" onClick={() => handleColorClick("rose", "200")} />
                <button className="h-12 w-full bg-rose-300 transition-opacity hover:opacity-90" onClick={() => handleColorClick("rose", "300")} />
                <button className="h-12 w-full bg-rose-400 transition-opacity hover:opacity-90" onClick={() => handleColorClick("rose", "400")} />
                <button className="h-12 w-full bg-rose-500 transition-opacity hover:opacity-90" onClick={() => handleColorClick("rose", "500")} />
                <button className="h-12 w-full bg-rose-600 transition-opacity hover:opacity-90" onClick={() => handleColorClick("rose", "600")} />
                <button className="h-12 w-full bg-rose-700 transition-opacity hover:opacity-90" onClick={() => handleColorClick("rose", "700")} />
                <button className="h-12 w-full bg-rose-800 transition-opacity hover:opacity-90" onClick={() => handleColorClick("rose", "800")} />
                <button className="h-12 w-full bg-rose-900 transition-opacity hover:opacity-90" onClick={() => handleColorClick("rose", "900")} />
                <button className="h-12 w-full bg-rose-950 transition-opacity hover:opacity-90" onClick={() => handleColorClick("rose", "950")} />
              </div>
            </div>

            {/* STONE */}
            <div className="group relative overflow-hidden rounded-lg bg-white shadow-md">
              {renderLock()}

              <div className="bg-gray-100 p-4">
                <h2 className="text-lg font-semibold">Stone</h2>
              </div>

              <div className="grid grid-cols-1">
                <button className="h-12 w-full bg-stone-50 transition-opacity hover:opacity-90" onClick={() => handleColorClick("stone", "50")} />
                <button className="h-12 w-full bg-stone-100 transition-opacity hover:opacity-90" onClick={() => handleColorClick("stone", "100")} />
                <button className="h-12 w-full bg-stone-200 transition-opacity hover:opacity-90" onClick={() => handleColorClick("stone", "200")} />
                <button className="h-12 w-full bg-stone-300 transition-opacity hover:opacity-90" onClick={() => handleColorClick("stone", "300")} />
                <button className="h-12 w-full bg-stone-400 transition-opacity hover:opacity-90" onClick={() => handleColorClick("stone", "400")} />
                <button className="h-12 w-full bg-stone-500 transition-opacity hover:opacity-90" onClick={() => handleColorClick("stone", "500")} />
                <button className="h-12 w-full bg-stone-600 transition-opacity hover:opacity-90" onClick={() => handleColorClick("stone", "600")} />
                <button className="h-12 w-full bg-stone-700 transition-opacity hover:opacity-90" onClick={() => handleColorClick("stone", "700")} />
                <button className="h-12 w-full bg-stone-800 transition-opacity hover:opacity-90" onClick={() => handleColorClick("stone", "800")} />
                <button className="h-12 w-full bg-stone-900 transition-opacity hover:opacity-90" onClick={() => handleColorClick("stone", "900")} />
                <button className="h-12 w-full bg-stone-950 transition-opacity hover:opacity-90" onClick={() => handleColorClick("stone", "950")} />
              </div>
            </div>

            {/* NEUTRAL */}
            <div className="group relative overflow-hidden rounded-lg bg-white shadow-md">
              {renderLock()}

              <div className="bg-gray-100 p-4">
                <h2 className="text-lg font-semibold">Neutral</h2>
              </div>

              <div className="grid grid-cols-1">
                <button className="h-12 w-full bg-neutral-50 transition-opacity hover:opacity-90" onClick={() => handleColorClick("neutral", "50")} />
                <button className="h-12 w-full bg-neutral-100 transition-opacity hover:opacity-90" onClick={() => handleColorClick("neutral", "100")} />
                <button className="h-12 w-full bg-neutral-200 transition-opacity hover:opacity-90" onClick={() => handleColorClick("neutral", "200")} />
                <button className="h-12 w-full bg-neutral-300 transition-opacity hover:opacity-90" onClick={() => handleColorClick("neutral", "300")} />
                <button className="h-12 w-full bg-neutral-400 transition-opacity hover:opacity-90" onClick={() => handleColorClick("neutral", "400")} />
                <button className="h-12 w-full bg-neutral-500 transition-opacity hover:opacity-90" onClick={() => handleColorClick("neutral", "500")} />
                <button className="h-12 w-full bg-neutral-600 transition-opacity hover:opacity-90" onClick={() => handleColorClick("neutral", "600")} />
                <button className="h-12 w-full bg-neutral-700 transition-opacity hover:opacity-90" onClick={() => handleColorClick("neutral", "700")} />
                <button className="h-12 w-full bg-neutral-800 transition-opacity hover:opacity-90" onClick={() => handleColorClick("neutral", "800")} />
                <button className="h-12 w-full bg-neutral-900 transition-opacity hover:opacity-90" onClick={() => handleColorClick("neutral", "900")} />
                <button className="h-12 w-full bg-neutral-950 transition-opacity hover:opacity-90" onClick={() => handleColorClick("neutral", "950")} />
              </div>
            </div>

            {/* ZINC */}
            <div className="group relative overflow-hidden rounded-lg bg-white shadow-md">
              {renderLock()}

              <div className="bg-gray-100 p-4">
                <h2 className="text-lg font-semibold">Zinc</h2>
              </div>

              <div className="grid grid-cols-1">
                <button className="h-12 w-full bg-zinc-50 transition-opacity hover:opacity-90" onClick={() => handleColorClick("zinc", "50")} />
                <button className="h-12 w-full bg-zinc-100 transition-opacity hover:opacity-90" onClick={() => handleColorClick("zinc", "100")} />
                <button className="h-12 w-full bg-zinc-200 transition-opacity hover:opacity-90" onClick={() => handleColorClick("zinc", "200")} />
                <button className="h-12 w-full bg-zinc-300 transition-opacity hover:opacity-90" onClick={() => handleColorClick("zinc", "300")} />
                <button className="h-12 w-full bg-zinc-400 transition-opacity hover:opacity-90" onClick={() => handleColorClick("zinc", "400")} />
                <button className="h-12 w-full bg-zinc-500 transition-opacity hover:opacity-90" onClick={() => handleColorClick("zinc", "500")} />
                <button className="h-12 w-full bg-zinc-600 transition-opacity hover:opacity-90" onClick={() => handleColorClick("zinc", "600")} />
                <button className="h-12 w-full bg-zinc-700 transition-opacity hover:opacity-90" onClick={() => handleColorClick("zinc", "700")} />
                <button className="h-12 w-full bg-zinc-800 transition-opacity hover:opacity-90" onClick={() => handleColorClick("zinc", "800")} />
                <button className="h-12 w-full bg-zinc-900 transition-opacity hover:opacity-90" onClick={() => handleColorClick("zinc", "900")} />
                <button className="h-12 w-full bg-zinc-950 transition-opacity hover:opacity-90" onClick={() => handleColorClick("zinc", "950")} />
              </div>
            </div>

            {/* SLATE */}
            <div className="group relative overflow-hidden rounded-lg bg-white shadow-md">
              {renderLock()}

              <div className="bg-gray-100 p-4">
                <h2 className="text-lg font-semibold">Slate</h2>
              </div>

              <div className="grid grid-cols-1">
                <button className="h-12 w-full bg-slate-50 transition-opacity hover:opacity-90" onClick={() => handleColorClick("slate", "50")} />
                <button className="h-12 w-full bg-slate-100 transition-opacity hover:opacity-90" onClick={() => handleColorClick("slate", "100")} />
                <button className="h-12 w-full bg-slate-200 transition-opacity hover:opacity-90" onClick={() => handleColorClick("slate", "200")} />
                <button className="h-12 w-full bg-slate-300 transition-opacity hover:opacity-90" onClick={() => handleColorClick("slate", "300")} />
                <button className="h-12 w-full bg-slate-400 transition-opacity hover:opacity-90" onClick={() => handleColorClick("slate", "400")} />
                <button className="h-12 w-full bg-slate-500 transition-opacity hover:opacity-90" onClick={() => handleColorClick("slate", "500")} />
                <button className="h-12 w-full bg-slate-600 transition-opacity hover:opacity-90" onClick={() => handleColorClick("slate", "600")} />
                <button className="h-12 w-full bg-slate-700 transition-opacity hover:opacity-90" onClick={() => handleColorClick("slate", "700")} />
                <button className="h-12 w-full bg-slate-800 transition-opacity hover:opacity-90" onClick={() => handleColorClick("slate", "800")} />
                <button className="h-12 w-full bg-slate-900 transition-opacity hover:opacity-90" onClick={() => handleColorClick("slate", "900")} />
                <button className="h-12 w-full bg-slate-950 transition-opacity hover:opacity-90" onClick={() => handleColorClick("slate", "950")} />
              </div>
            </div>

          </div>
        </div>
      </div>
      <PremiumRequiredModal
  open={showPremiumModal}
  onOpenChange={setShowPremiumModal}
  feature="Color palette copying"
/>
    </>
  );
}

