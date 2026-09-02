
"use client";

import { useState, useCallback } from "react";
import { Lock } from "lucide-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

import { useSubscription } from "@/components/subscription-provider";
import PremiumRequiredModal from "@/components/ui_components/PremiumRequiredModal";

const buttonStyles = [
  {
    name: "Shadow Button",
    code: `<button class="text-sm text-gray-900 py-2.5 p-12 rounded-lg bg-white cursor-pointer border border-gray-200 transition-all duration-300 shadow-[6px_6px_12px_#c5c5c5,-6px_-6px_12px_#ffffff] hover:shadow-[inset_4px_4px_12px_#c5c5c5,inset_-4px_-4px_12px_#ffffff] active:text-gray-600 active:shadow-[inset_4px_4px_12px_#c5c5c5,inset_-4px_-4px_12px_#ffffff]">Button</button>`
  },
  {
    name: "Red Linear Gradient Button",
    code: ` <button class="bg-gradient-to-r text-sm from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white font-bold py-2 px-4 rounded">Sign Out</button>`
  },
  {
    name: "Glowing Button",
    code: `<div class=" w-screen flex justify-center items-center">

    <div class="relative inline-flex  group">
        <div
            class="absolute transitiona-all duration-1000 opacity-70 -inset-px bg-gradient-to-r from-[#44BCFF] via-[#FF44EC] to-[#FF675E] rounded-xl blur-lg group-hover:opacity-100 group-hover:-inset-1 group-hover:duration-200 animate-tilt">
        </div>
        <a href="#" title="Get quote now"
            class="relative inline-flex items-center justify-center px-8 py-4 text-sm font-bold text-white transition-all duration-200 bg-gray-900 font-pj rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
            role="button">Glowing Button
        </a>
    </div>
</div>`
  },
  {
    "name": "Green Linear Grdient Button",
    "code": ` <button class="bg-gradient-to-r text-sm from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white font-bold py-2 px-4 rounded">Register</button>`
  },
  {
    "name": "Subtle Drop Shadow Button",
    "code": ` <button class="bg-white shadow-md hover:shadow-lg transition-shadow duration-300 text-sm text-gray-900 font-bold py-2 px-4 rounded">Subtle Drop Shadow</button>`
  },
  {
    "name": "Subtle Yellow Shadow Button",
    "code": `<button class="bg-white shadow-md hover:shadow-lg  transition-shadow duration-100 text-sm text-gray-900 font-bold py-2 px-4 rounded shadow-yellow-400 hover:shadow-yellow-500/70">Subtle Yellow Shadow</button>`
  },
  {
    "name": "Rotating Button",
    "code": `<button class="rounded-lg px-3.5 py-2 m-1 overflow-hidden relative group cursor-pointer border-2 font-medium border-indigo-600 text-sm"><span class="absolute w-64 h-0 transition-all duration-300 origin-center rotate-45 -translate-x-20 bg-indigo-600 top-1/2 group-hover:h-64 group-hover:-translate-y-32 ease"></span><span class="relative text-sm font-semibold text-indigo-600 transition duration-300 group-hover:text-white ease">Button Text</span></button>`
  },
  {
    "name": "Red Button",
    "code": `<button href="" id=""
  class="bg-red-500 hover:bg-red-600 transition-all text-white py-2 px-4 rounded inline-block text-sm font-semibold relative before:absolute before:bg-gradient-to-tr before:from-yellow-600 before:via-transparent before:to-green-700 before:inset-0 before:scale-110 before:rounded before:blur-md before:-z-10">
  Red button
</button>`
  },
  {
    "name": "Background Color Change Button",
    "code": `<button class="group relative inline-block px-3.5 py-2 overflow-hidden font-medium text-indigo-600 border-2 border-indigo-600 rounded-lg focus:outline-none text-sm"><span class="absolute top-0 left-0 w-full h-full bg-indigo-600 transform scale-x-0 group-hover:scale-x-100 transition-all duration-300 ease"></span><span class="relative group-hover:text-white">Button Text</span></button>`
  },
  {
    "name": "Facebook Button",
    "code": `<button class=\"bg-white sticky duration-500 border-2 border-blue-600 fixed w-12 transform hover:-translate-y-3 h-12 text-sm rounded-full hover:bg-blue-600 hover:text-white text-blue-600\"> <i class=\"fab fa-facebook-f\"></i></button>`
  },
  {
    "name": "Prominent Shadow Button",
    "code": `   <button class="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 text-sm text-gray-900 font-bold py-2 px-4 rounded">Prominent Shadow Button</button>`
  },
  {
    "name": "Group Button",
    "code": `<div class="inline-flex items-center rounded-md shadow-sm">
    <button
        class="text-slate-800 hover:text-blue-600 text-sm bg-white hover:bg-slate-100 border border-slate-200 rounded-l-lg font-medium px-4 py-2 inline-flex space-x-1 items-center">
        <span><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round"
                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
        </span>
        <span class="hidden md:inline-block">Edit</span>
    </button>
    <button
        class="text-slate-800 hover:text-blue-600 text-sm bg-white hover:bg-slate-100 border-y border-slate-200 font-medium px-4 py-2 inline-flex space-x-1 items-center">
        <span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round"
                    d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        </span>
        <span class="hidden md:inline-block">View</span>
    </button>
    <button
        class="text-slate-800 hover:text-blue-600 text-sm bg-white hover:bg-slate-100 border border-slate-200 rounded-r-lg font-medium px-4 py-2 inline-flex space-x-1 items-center">
        <span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round"
                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
        </span>
        <span class="hidden md:inline-block">Delete</span>
    </button>
</div>`
  },
  {
    name: "Loading Button  ",
    code: ` <button disabled type="button" class="py-2.5 px-5 me-2 text-sm font-medium text-gray-900 bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:outline-none focus:ring-blue-700 focus:text-blue-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700 inline-flex items-center">
<svg aria-hidden="true" role="status" class="inline w-4 h-4 me-3 text-gray-200 animate-spin dark:text-gray-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
<path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="#1C64F2"/>
</svg>
Loading...
</button>`
  },
  {
    name: "Folded Corner Button  ",
    code: `<a href="#_" class="relative inline-flex items-center justify-start px-6 py-3 overflow-hidden font-medium transition-all bg-red-500 rounded-xl group text-sm"> <span class="absolute top-0 right-0 inline-block w-4 h-4 transition-all duration-500 ease-in-out bg-red-700 rounded group-hover:-mr-4 group-hover:-mt-4"> <span class="absolute top-0 right-0 w-5 h-5 rotate-45 translate-x-1/2 -translate-y-1/2 bg-white"></span> </span> <span class="absolute bottom-0 left-0 w-full h-full transition-all duration-500 ease-in-out delay-200 -translate-x-full translate-y-full bg-red-600 rounded-2xl group-hover:mb-12 group-hover:translate-x-0"></span> <span class="relative w-full text-left text-white transition-colors duration-200 ease-in-out group-hover:text-white">Button Text</span> </a>`
  },
  {
    name: "Dark Red to Black Gradient Button",
    code: `<button type="button" class="py-2  px-4 font-semibold text-white rounded-lg shadow-md bg-gradient-to-r from-red-800 to-black hover:from-red-900 hover:to-gray-800 transition duration-200 text-sm">Dark Red to Black Gradient Button</button>`
  },
  {
    name: "Dimensional Text Button ",
    code: `<a href="#_" class="relative px-6 py-3 font-bold text-black group text-sm"> <span class="absolute inset-0 w-full h-full transition duration-300 ease-out transform -translate-x-2 -translate-y-2 bg-blue-300 group-hover:translate-x-0 group-hover:translate-y-0"></span> <span class="absolute inset-0 w-full h-full border-4 border-black"></span> <span class="relative">Button Text 1</span> </a>`
  },
  {
    name: "Loading button",
    code: `<button disabled type="button" class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 inline-flex items-center">
<svg aria-hidden="true" role="status" class="inline w-4 h-4 me-3 text-white animate-spin" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="#E5E7EB"/>
<path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentColor"/>
</svg>
Loading...
</button>`
  },
  {
    name: "Dimensional Text Button 3 ",
    code: `<a href="#_" class="relative px-6 py-3 font-bold text-black group text-sm"> <span class="absolute inset-0 w-full h-full transition duration-300 ease-out transform -translate-x-2 -translate-y-2 bg-yellow-300 group-hover:translate-x-0 group-hover:translate-y-0"></span> <span class="absolute inset-0 w-full h-full border-4 border-black"></span> <span class="relative">Button Text 3</span> </a>`
  },
  {
    name: "Google ",
    code: `<button class="rounded-md flex items-center border border-slate-300 py-2 px-4 text-center text-sm transition-all shadow-sm hover:shadow-lg text-slate-600 hover:text-white hover:bg-slate-800 hover:border-slate-800 focus:text-white focus:bg-slate-800 focus:border-slate-800 active:border-slate-800 active:text-white active:bg-slate-800 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none" type="button"> <img src="https://docs.material-tailwind.com/icons/google.svg" alt="metamask" class="h-5 w-5 mr-2" /> Continue with Google </button>`
  },
  {
    "name": "Instagram Button",
    "code": "<button class=\"border-2 hover:border-0 border-pink-500 bg-gradient-to-b text-sm hover:from-indigo-600 hover:via-pink-600 hover:to-yellow-500 min-w-wull hover:text-white bg-white text-pink-600 w-12 h-12 transform hover:-translate-y-3 rounded-full duration-500\"><i class=\"fab fa-instagram\"></i></button>"
  },
  {
    name: "Figma",
    code: `<button class="px-6 py-2 bg-black text-white rounded-lg font-bold transform hover:-translate-y-1 transition duration-400 text-sm"> Figma </button>`
  },
  {
    name: "Cyan to Dark Cyan Gradient Button",
    code: `<button type="button" class="py-2 mt-2 px-4 font-semibold text-white rounded-lg shadow-md bg-gradient-to-r from-cyan-500 to-cyan-700 hover:from-cyan-600 hover:to-cyan-800 transition duration-200 text-sm">Cyan to Dark Cyan Gradient Button</button>`
  },
  {
    name: "Winter White",
    code: `<button class="shadow-[0_4px_14px_0_rgb(0,0,0,10%)] hover:shadow-[0_6px_20px_rgba(93,93,93,23%)] px-8 py-2 bg-[#fff] text-[#696969] rounded-md font-light transition duration-200 ease-linear text-sm"> Next White </button>`
  },
  {
    name: "Microsoft Button",
    code: `<button class="flex items-center bg-white text-black font-bold py-3  px-20 rounded border-2 border-black  transition duration-300 ease-in-out text-sm"> <img class="mx-auto" src="https://upload.wikimedia.org/wikipedia/commons/b/b6/Microsoft_logo_%281987%29.svg" alt="FIFA World Cup" width="70" height="20"/> </button>`
  },

  {
    name: "Swith button",
    code: `<div class="flex justify-center">
    <nav
        class="flex overflow-x-auto items-center p-1 space-x-1 rtl:space-x-reverse text-sm text-gray-600 bg-gray-500/5 rounded-xl dark:bg-gray-500/20">
        <button role="tab" type="button"
            class="flex whitespace-nowrap items-center h-8 px-5 font-medium rounded-lg outline-none focus:ring-2 focus:ring-yellow-600 focus:ring-inset text-yellow-600 shadow bg-white dark:text-white dark:bg-yellow-600 text-sm"
            aria-selected="">
            Addresses
        </button>

        <button role="tab" type="button"
            class="flex whitespace-nowrap items-center h-8 px-5 font-medium rounded-lg outline-none focus:ring-2 focus:ring-yellow-600 focus:ring-inset hover:text-gray-800 focus:text-yellow-600 dark:text-gray-400 dark:hover:text-gray-300 dark:focus:text-gray-400 text-sm">
            Payments
        </button>
    </nav>
</div>`
  },
  {
    name: "Notion Project Button",
    code: `<div class="flex flex-wrap justify-center gap-6"><a class="relative text-sm" href="#"><span class="absolute top-0 left-0 mt-1 ml-1 h-full w-full rounded bg-black"></span><span class="fold-bold relative inline-block h-full w-full rounded border-2 border-black bg-white px-3 py-1 text-base font-bold text-black transition duration-100 hover:bg-yellow-400 hover:text-gray-900">notion button</span></a></div>`
  },
  {
    name: "Force Button",
    code: `<button class="flex items-center bg-black text-black font-bold px-12 transition duration-300 ease-in-out text-sm">
    <img class="mx-auto" src="https://upload.wikimedia.org/wikipedia/commons/6/6c/Star_Wars_Logo.svg" alt="FIFA World Cup" width="70" height="20"/>
</button>
        `
  },
  {
    "name": "WhatsApp Button",
    "code": "<button class=\"bg-white duration-500 w-12 h-12 border-2 rounded-full border-green-600 transform hover:-translate-y-3 text-sm text-green-500 hover:bg-green-600 hover:text-white\"><i class=\"fab fa-whatsapp\"></i></button>"
  },



{
  name: "Group Button",
code: `<link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet"> 
<div class="inline-flex bg-gradient-to-r from-blue-500 to-blue-300 bg-opacity-30 backdrop-blur-lg rounded-lg shadow-2xl p-2">
  <button class="bg-transparent text-white text-sm font-semibold py-2 px-4 border border-blue-500 hover:bg-blue-600 hover:text-white rounded-l-md transition duration-300 shadow-md">
     Option 1
  </button>
  <div class="border-l border-blue-500"></div>
  <button class="bg-transparent text-white text-sm font-semibold py-2 px-4 border border-blue-500 hover:bg-blue-600 hover:text-white transition duration-300 shadow-md">
     Option 2
  </button>
  <div class="border-l border-blue-500"></div>
  <button class="bg-transparent text-white text-sm font-semibold py-2 px-4 border border-blue-500 hover:bg-blue-600 hover:text-white rounded-r-md transition duration-300 shadow-md">
    Option 3
  </button>
</div>`},
{
  name: "Group Button",
code: `<link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet"> 
<div class="inline-flex bg-gradient-to-br from-green-400 to-blue-500 bg-opacity-25 backdrop-blur-lg rounded-lg shadow-xl p-2">
  <button class="bg-transparent text-gray-900 text-sm font-semibold py-2 px-4 border border-gray-900 hover:bg-gray-900 hover:text-white rounded-l-md transition duration-300 shadow-lg">
     Option 1
  </button>
  <div class="border-l border-gray-900"></div>
  <button class="bg-transparent text-gray-900 text-sm font-semibold py-2 px-4 border border-gray-900 hover:bg-gray-900 hover:text-white transition duration-300 shadow-lg">
     Option 2
  </button>
  <div class="border-l border-gray-900"></div>
  <button class="bg-transparent text-gray-900 text-sm font-semibold py-2 px-4 border border-gray-900 hover:bg-gray-900 hover:text-white rounded-r-md transition duration-300 shadow-lg">
    Option 3
  </button>
</div>`},

{
  name: "Group Button ",
code: `<link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
<div class="inline-flex bg-white bg-opacity-30 backdrop-blur-lg rounded-lg shadow-lg p-2">
  <button class="bg-blue-500 text-white text-sm font-semibold py-2 px-4 border border-blue-500 hover:bg-blue-600 rounded-l-md transition duration-300">
     Option 1
  </button>
  <div class="h-6 border-l border-blue-500"></div>
  <button class="bg-blue-500 text-white text-sm font-semibold py-2 px-4 border border-blue-500 hover:bg-blue-600 transition duration-300">
     Option 2
  </button>
  <div class="h-6 border-l border-blue-500"></div>
  <button class="bg-blue-500 text-white text-sm font-semibold py-2 px-4 border border-blue-500 hover:bg-blue-600 rounded-r-md transition duration-300">
    Option 3
  </button>
</div>`},

{
  name: "Group Button ",
code: `<div class="inline-flex bg-white bg-opacity-30 backdrop-blur-lg rounded-lg shadow-lg p-2">
  <button class="bg-transparent text-blue-500 text-sm font-semibold py-2 px-4 border border-blue-500 hover:bg-blue-500 hover:text-white rounded-l-md transition duration-300">
     Option 1
  </button>
  <div class=" border-l border-blue-500"></div>
  <button class="bg-transparent text-blue-500 text-sm font-semibold py-2 px-4 border border-blue-500 hover:bg-blue-500 hover:text-white transition duration-300">
     Option 2
  </button>
  <div class="border-l border-blue-500"></div>
  <button class="bg-transparent text-blue-500 text-sm font-semibold py-2 px-4 border border-blue-500 hover:bg-blue-500 hover:text-white rounded-r-md transition duration-300">
    Option 3
  </button>
</div>`},

  {
    name: "Spark Button",
    code: `<button class="flex items-center bg-white text-black font-bold   px-11 rounded border-2 border-orange-500 hover:border-red-400 transition duration-300 ease-in-out text-sm">
    <img class="mx-auto" src="https://cdn.neowin.com/news/images/uploaded/2019/05/1557639159_tinderlogo-2017.jpg" alt="FIFA World Cup" width="70" height="20"/>
</button>
        `
  },
{
  name: "FIFA Button",
  code: `<button class="flex items-center bg-white text-black font-bold py-2 pl-5 pr-3 rounded border-2 border-blue-300 hover:border-blue-400 transition duration-300 ease-in-out text-sm">
    <img class="mr-2 " src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRsmWldT7_OE2kDhbehYcuTNHzItGFbeH5igw&s" alt="FIFA World Cup" width="70" height="20"/>
</button>
    `
},
{
  "name": "Twitter Button",
  "code": "<button class=\"bg-white transform hover:-translate-y-3 border-2 w-12 h-12 rounded-full duration-500 text-blue-400 border-blue-400 hover:bg-blue-400 hover:text-white text-sm\"><i class=\"fab fa-twitter\"></i></button>"
},
  {
    name: "Upload Button",
    code: `<button type="button" class="max-w-[140px] py-2 px-4 flex justify-center items-center  bg-red-600 hover:bg-red-700 focus:ring-red-500 focus:ring-offset-red-200 text-white w-full transition ease-in duration-200 text-center text-sm font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2  rounded-lg ">
    <svg width="20" height="20" fill="currentColor" class="mr-2" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg">
        <path d="M1344 1472q0-26-19-45t-45-19-45 19-19 45 19 45 45 19 45-19 19-45zm256 0q0-26-19-45t-45-19-45 19-19 45 19 45 45 19 45-19 19-45zm128-224v320q0 40-28 68t-68 28h-1472q-40 0-68-28t-28-68v-320q0-40 28-68t68-28h427q21 56 70.5 92t110.5 36h256q61 0 110.5-36t70.5-92h427q40 0 68 28t28 68zm-325-648q-17 40-59 40h-256v448q0 26-19 45t-45 19h-256q-26 0-45-19t-19-45v-448h-256q-42 0-59-40-17-39 14-69l448-448q18-19 45-19t45 19l448 448q31 30 14 69z">
        </path>
    </svg>
    Upload
</button>
        `
},
{
  name: "Apocalypse Button",
  code: `<button class="flex items-center px-20 py-1 bg-black  border text-black font-bold rounded-2xl text-sm"><img  src="https://assetsio.gnwcdn.com/umbrella_corp_1.png?width=1200&height=1200&fit=crop&quality=100&format=png&enable=upscale&auto=webp" alt="Button Icon" width="40" height="20"/></button>
    `
},
{
  name: "Disney Button",
  code: `
    <button class="flex items-center bg-white  border text-black font-bold py-2 pr-5 rounded text-sm">
    <img  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSyIS_GMENyqoWukYofDbpdwLZQoI5s0DmQiw&s" alt="Button Icon" width="50" height="20"/>
    Open AI
  </button>
    `
},
{
  name: "Count Indicator Button",
  code: `
   <!-- component -->
<div class="flex items-center justify-center">
    
<button type="button" class="relative inline-flex items-center px-5 py-2.5 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
<svg class="w-4 h-4 me-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 16">
<path d="m10.036 8.278 9.258-7.79A1.979 1.979 0 0 0 18 0H2A1.987 1.987 0 0 0 .641.541l9.395 7.737Z"/>
<path d="M11.241 9.817c-.36.275-.801.425-1.255.427-.428 0-.845-.138-1.187-.395L0 2.6V14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2.5l-8.759 7.317Z"/>
</svg>
<span class="sr-only">Notifications</span>
Messages
  <div class="absolute inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-500 border-2 border-white rounded-full -top-2 -end-2 dark:border-gray-900">8</div>
</button>

  </div>
    `
},
{
  name: "Indigo Circle Button",
  code: `
    <button class='relative inline-flex items-center justify-center p-0.5 mb-2 mr-2 overflow-hidden text-sm text-indigo-600 font-semibold rounded-full group bg-gradient-to-br from-indigo-600 to-indigo-500 group-hover:from-indigo-600 group-hover:to-indigo-500 hover:text-white'>
        <span class='relative py-2 px-5 transition-all ease-in duration-75 bg-white rounded-full group-hover:bg-opacity-0'> Button </span>
    </button>
    `,
},
{
  name: "Blue Circle Button",
  code: `
    <button class='relative inline-flex items-center justify-center p-0.5 mb-2 mr-2 overflow-hidden text-sm text-blue-600 font-semibold rounded-full group bg-gradient-to-br from-blue-500 to-blue-300 group-hover:from-blue-500 group-hover:to-blue-300 hover:text-white'>
        <span class='relative py-2 px-5 transition-all ease-in duration-75 bg-white rounded-full group-hover:bg-opacity-0'> Button </span>
    </button>
    `,
},
{
  name: "Green Circle Button",
  code: `
    <button class='relative inline-flex items-center justify-center p-0.5 mb-2 mr-2 overflow-hidden text-sm text-green-600 font-semibold rounded-full group bg-gradient-to-br from-green-500 to-green-300 group-hover:from-green-500 group-hover:to-green-300 hover:text-white'>
        <span class='relative py-2 px-5 transition-all ease-in duration-75 bg-white rounded-full group-hover:bg-opacity-0'> Button </span>
    </button>
    `,
},
{
  name: "Pink Circle Button",
  code: `
    <button class='relative inline-flex items-center justify-center p-0.5 mb-2 mr-2 overflow-hidden text-sm text-pink-600 font-semibold rounded-full group bg-gradient-to-br from-pink-500 to-pink-400 group-hover:from-pink-500 group-hover:to-pink-400 hover:text-white'>
        <span class='relative py-2 px-5 transition-all ease-in duration-75 bg-white rounded-full group-hover:bg-opacity-0'> Button </span>
    </button>
    `,
},
{
  name: "Orange Circle Button",
  code: `
    <button class='relative inline-flex items-center justify-center p-0.5 mb-2 mr-2 overflow-hidden text-sm text-orange-600 font-semibold rounded-full group bg-gradient-to-br from-orange-500 to-orange-300 group-hover:from-orange-500 group-hover:to-orange-300 hover:text-white'>
        <span class='relative py-2 px-5 transition-all ease-in duration-75 bg-white rounded-full group-hover:bg-opacity-0'> Button </span>
    </button>
    `,
},
{
  name: "Yellow Circle Button",
  code: `
    <button class='relative inline-flex items-center justify-center p-0.5 mb-2 mr-2 overflow-hidden text-sm text-yellow-600 font-semibold rounded-full group bg-gradient-to-br from-yellow-400 to-yellow-200 group-hover:from-yellow-400 group-hover:to-yellow-200 hover:text-white'>
        <span class='relative py-2 px-5 transition-all ease-in duration-75 bg-white rounded-full group-hover:bg-opacity-0'> Button </span>
    </button>
    `,
},
{
  name: "Gray Circle Button",
  code: `
    <button class='relative inline-flex items-center justify-center p-0.5 mb-2 mr-2 overflow-hidden text-sm text-gray-600 font-semibold rounded-full group bg-gradient-to-br from-gray-700 to-gray-500 group-hover:from-gray-700 group-hover:to-gray-500 hover:text-white'>
        <span class='relative py-2 px-5 transition-all ease-in duration-75 bg-white rounded-full group-hover:bg-opacity-0'> Button </span>
    </button>
    `,
},
{
  name: "Indigo Rounded Button",
  code: `
    <button class='relative inline-flex items-center justify-center p-0.5 mb-2 mr-2 overflow-hidden text-sm text-indigo-600 font-semibold rounded-lg group bg-gradient-to-br from-indigo-600 to-indigo-500 group-hover:from-indigo-600 group-hover:to-indigo-500 hover:text-white'>
        <span class='relative py-2 px-5 transition-all ease-in duration-75 bg-white rounded-lg group-hover:bg-opacity-0'> Button </span>
    </button>
    `,
},
{
  name: "Blue Rounded Button",
  code: `
    <button class='relative inline-flex items-center justify-center p-0.5 mb-2 mr-2 overflow-hidden text-sm text-blue-600 font-semibold rounded-lg group bg-gradient-to-br from-blue-500 to-blue-300 group-hover:from-blue-500 group-hover:to-blue-300 hover:text-white'>
        <span class='relative py-2 px-5 transition-all ease-in duration-75 bg-white rounded-lg group-hover:bg-opacity-0'> Button </span>
    </button>
    `,
},
{
name: "Amazing Hover Button",
code: `
 <a href="https://websitecost.today/" target="_blank"
    class="group relative overflow-hidden bg-blue-600 focus:ring-4 focus:ring-blue-300 inline-flex items-center px-7 py-2.5 rounded-lg text-white justify-center text-sm">
    <span class="z-40">Hover Me</span>
    <svg class="z-40 ml-2 -mr-1 w-3 h-3 transition-all duration-300 group-hover:translate-x-1" fill="currentColor"
        viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd"
            d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
            clip-rule="evenodd"></path>
    </svg>
    <div
        class="absolute inset-0 h-[200%] w-[200%] rotate-45 translate-x-[-70%] transition-all group-hover:scale-100 bg-white/30 group-hover:translate-x-[50%] z-20 duration-1000">
    </div>
</a>
  `,
},
{
  name: "Green Rounded Button",
  code: `
    <button class='relative inline-flex items-center justify-center p-0.5 mb-2 mr-2 overflow-hidden text-sm text-green-600 font-semibold rounded-lg group bg-gradient-to-br from-green-500 to-green-300 group-hover:from-green-500 group-hover:to-green-300 hover:text-white'>
        <span class='relative py-2 px-5 transition-all ease-in duration-75 bg-white rounded-lg group-hover:bg-opacity-0'> Button </span>
    </button>
    `,
},
{
  name: "Pink Rounded Button",
  code: `
    <button class='relative inline-flex items-center justify-center p-0.5 mb-2 mr-2 overflow-hidden text-sm text-pink-600 font-semibold rounded-lg group bg-gradient-to-br from-pink-500 to-pink-400 group-hover:from-pink-500 group-hover:to-pink-400 hover:text-white'>
        <span class='relative py-2 px-5 transition-all ease-in duration-75 bg-white rounded-lg group-hover:bg-opacity-0'> Button </span>
    </button>
    `,
},
{
name: "Side Hover Button",
code: `
 <button class="before:ease relative h-12 w-40 overflow-hidden border border-black shadow-2xl before:absolute before:left-0 before:-ml-2 before:h-48 before:w-48 before:origin-top-right before:-translate-x-full before:translate-y-12 before:-rotate-90 before:bg-gray-900 before:transition-all before:duration-300 hover:text-white hover:shadow-black hover:before:-rotate-180 text-sm">
      <span class="relative z-10">Slide hover</span>
    </button>
  `
},
{
  name: "Orange Rounded Button",
  code: `
    <button class='relative inline-flex items-center justify-center p-0.5 mb-2 mr-2 overflow-hidden text-sm text-orange-600 font-semibold rounded-lg group bg-gradient-to-br from-orange-500 to-orange-300 group-hover:from-orange-500 group-hover:to-orange-300 hover:text-white'>
        <span class='relative py-2 px-5 transition-all ease-in duration-75 bg-white rounded-lg group-hover:bg-opacity-0'> Button </span>
    </button>
    `,
},
{
  name: "Yellow Rounded Button",
  code: `
    <button class='relative inline-flex items-center justify-center p-0.5 mb-2 mr-2 overflow-hidden text-sm text-yellow-600 font-semibold rounded-lg group bg-gradient-to-br from-yellow-400 to-yellow-200 group-hover:from-yellow-400 group-hover:to-yellow-200 hover:text-white'>
        <span class='relative py-2 px-5 transition-all ease-in duration-75 bg-white rounded-lg group-hover:bg-opacity-0'> Button </span>
    </button>
    `,
},
{
  name: "Gray Rounded Button",
  code: `
    <button class='relative inline-flex items-center justify-center p-0.5 mb-2 mr-2 overflow-hidden text-sm text-gray-600 font-semibold rounded-lg group bg-gradient-to-br from-gray-700 to-gray-500 group-hover:from-gray-700 group-hover:to-gray-500 hover:text-white'>
        <span class='relative py-2 px-5 transition-all ease-in duration-75 bg-white rounded-lg group-hover:bg-opacity-0'> Button </span>
    </button>
    `,
},


{
  name: "Netflix",
  code: ` <button class="py-2 px-4 bg-red-600 text-white font-semibold rounded-lg transition-transform duration-200 hover:scale-105 text-sm">Start Watching Now</button>
    `
},
{
  name: "Processing Button",
  code: `
      <div class="flex  items-center justify-center">
        <button type="button" class="flex items-center rounded-lg bg-green-700 px-4 py-2 text-white text-sm" disabled>
          <svg class="mr-3 h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span class="font-medium"> Processing... </span>
        </button>
      </div>
    `
},


{
  name: "Curtain Hover Effect",
  code: ` <button class="before:ease relative h-12 w-40 overflow-hidden border border-blue-500 text-blue-500 shadow-2xl transition-all before:absolute before:top-1/2 before:h-0 before:w-64 before:origin-center before:-translate-x-20 before:rotate-45 before:bg-blue-500 before:duration-300 hover:text-white hover:shadow-blue-500 hover:before:h-64 hover:before:-translate-y-32 text-sm">
      <span class="relative z-10">Skew curtain</span>
    </button>
    `
},

 
  {
      name: "Disney Button",
      code: `
         <button class="bg-white border border-black  px-8 w-38 rounded flex items-center text-sm">
        <div class="flex justify-center items-center w-full">
            <img class="mr-2 w-12 h-10" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSSEpAAy4WojeOlFUjE84IxCMIl3_sK8OiOeg&s" alt="Disney Logo" />
        </div>
    </button>
        `
    },
   
        {
          "name": "Sketch Button",
          "code": "<button class='px-4 py-2 rounded-md border border-black bg-white text-black text-sm hover:shadow-[4px_4px_0px_0px_rgba(0,0,0)] transition duration-200'>Sketch</button>"
        },
        {
          "name": "Simple Button",
          "code": "<button class='px-4 py-2 rounded-md border border-neutral-300 bg-neutral-100 text-neutral-500 text-sm hover:-translate-y-1 transform transition duration-200 hover:shadow-md'>Simple</button>"
        },
        {
          "name": "Invert Button",
          "code": "<button class='px-8 py-2 rounded-md bg-teal-500 text-white font-bold transition duration-200 hover:bg-white hover:text-black border-2 border-transparent hover:border-teal-500 text-sm'>Invert it</button>"
        },
        {
          "name": "Tailwindcss Connect Button",
          "code": "<button class='bg-slate-800 no-underline group cursor-pointer relative shadow-2xl shadow-zinc-900 rounded-full p-px text-xs font-semibold leading-6 text-white inline-block text-sm'><span class='absolute inset-0 overflow-hidden rounded-full'><span class='absolute inset-0 rounded-full bg-[image:radial-gradient(75%_100%_at_50%_0%,rgba(56,189,248,0.6)_0%,rgba(56,189,248,0)_75%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100'></span></span><div class='relative flex space-x-2 items-center z-10 rounded-full bg-zinc-950 py-0.5 px-4 ring-1 ring-white/10 '><span>Tailwind Connect</span><svg width='16' height='16' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'><path stroke='currentColor' strokeLinecap='round' strokeLinejoin='round' strokeWidth='1.5' d='M10.75 8.75L14.25 12L10.75 15.25'></path></svg></div><span class='absolute -bottom-0 left-[1.125rem] h-px w-[calc(100%-2.25rem)] bg-gradient-to-r from-emerald-400/0 via-emerald-400/90 to-emerald-400/0 transition-opacity duration-500 group-hover:opacity-40'></span></button>"
        },
           
        {
          "name": "Brutal Button",
          "code": "<button class='px-8 py-0.5  border-2 border-black dark:border-white uppercase bg-white text-black transition duration-200 text-sm shadow-[1px_1px_rgba(0,0,0),2px_2px_rgba(0,0,0),3px_3px_rgba(0,0,0),4px_4px_rgba(0,0,0),5px_5px_0px_0px_rgba(0,0,0)] dark:shadow-[1px_1px_rgba(255,255,255),2px_2px_rgba(255,255,255),3px_3px_rgba(255,255,255),4px_4px_rgba(255,255,255),5px_5px_0px_0px_rgba(255,255,255)] '>Brutal</button>"
        },
        {
          "name": "Favourite Button",
          "code": "<button class='px-8 py-2  bg-black text-white text-sm rounded-md font-semibold hover:bg-black/[0.8] hover:shadow-lg'>Favourite</button>"
        },
        {
          "name": "Outline Button",
          "code": "<button class='px-4 py-2 rounded-xl border border-neutral-600 text-black bg-white hover:bg-gray-100 transition duration-200 text-sm'>Outline</button>"
        },
        {
          "name": "Shimmer Button",
          "code": "<button class='inline-flex h-12 animate-shimmer items-center justify-center rounded-md border border-slate-800 bg-[linear-gradient(110deg,#000103,45%,#1e2631,55%,#000103)] bg-[length:200%_100%] px-6 font-medium text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50 text-sm'>Shimmer</button>"
        },
        {
          "name": "Next.js Blue Button",
          "code": "<button class='shadow-[0_4px_14px_0_rgb(0,118,255,39%)] hover:shadow-[0_6px_20px_rgba(0,118,255,23%)] hover:bg-[rgba(0,118,255,0.9)] px-8 py-2 bg-[#0070f3] rounded-md text-white font-light transition duration-200 ease-linear text-sm'>Next.js Blue</button>"
        },
        {
          "name": "Next.js White Button",
          "code": "<button class='shadow-[0_4px_14px_0_rgb(0,0,0,10%)] hover:shadow-[0_6px_20px_rgba(93,93,93,23%)] px-8 py-2 bg-[#fff] text-[#696969] rounded-md font-light transition duration-200 ease-linear text-sm'>Next White</button>"
        },
        {
          "name": "Spotify Button",
          "code": "<button class='px-12 py-4 rounded-full bg-[#1ED760] font-bold text-white tracking-widest uppercase transform hover:scale-105 hover:bg-[#21e065] transition-colors duration-200 text-sm'>Spotify</button>"
        },
        {
          "name": "Backdrop Blur Button",
          "code": "<button class='px-4 py-2 text-black backdrop-blur-sm border border-black rounded-md hover:shadow-[0px_0px_4px_4px_rgba(0,0,0,0.1)] bg-white/[0.2] text-sm transition duration-200'>Backdrop blur</button>"
        },
        {
          "name": "Playlist Button",
          "code": "<button class='shadow-[inset_0_0_0_2px_#616467] text-black px-12 py-4 rounded-full tracking-widest uppercase font-bold bg-transparent hover:bg-[#616467] hover:text-white dark:text-neutral-200 transition duration-200 text-sm'>Playlist</button>"
        },
        {
          "name": "Figma Button",
          "code": "<button class='px-6 py-2 bg-black text-white rounded-lg font-bold transform hover:-translate-y-1 transition duration-400 text-sm'>Figma</button>"
        },
        {
          "name": "Figma Outline Button",
          "code": "<button class='shadow-[0_0_0_3px_#000000_inset] px-6 py-2 bg-transparent border border-black dark:border-white dark:text-white text-black rounded-lg font-bold transform hover:-translate-y-1 transition duration-400 text-sm'>Figma Outline</button>"
        },
       
     
    

{
  name: "Mario Vaiation",
  code: `
      <a href="#" class="bg-green-500 rounded-lg p-2 flex items-center justify-center hover:bg-blue-600 transition duration-300 ease-in-out text-sm">
    <img src="https://49iw5aq3b5e3nyxk.public.blob.vercel-storage.com/MushroomMarioKart8-ckIgqDXpzJuUv8e5WPXEkFt9gYgNIy.webp" alt="Mushroom" class="px-20 mr-2 h-9" />
  </a>
    `
},

{
  name: "Made with love button",
  code: `
     <!-- component -->
<div class="flex">
  <button
    class="middle none center mr-4 flex items-center justify-center rounded-lg bg-pink-500 p-3 font-sans text-xs font-bold uppercase text-white shadow-md shadow-pink-500/20 transition-all hover:shadow-lg hover:shadow-pink-500/40 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none text-sm"
    data-ripple-light="true"
  >
    <i class="fas fa-heart text-lg leading-none"></i>
  </button>
  <button
    class="middle none center mr-4 flex items-center justify-center rounded-lg bg-gradient-to-tr from-pink-600 to-pink-400 p-3 font-sans text-xs font-bold uppercase text-white shadow-md shadow-pink-500/20 transition-all hover:shadow-lg hover:shadow-pink-500/40 active:opacity-[0.85] disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none text-sm"
    data-ripple-light="true"
  >
    <i class="fas fa-heart text-lg leading-none"></i>
  </button>
  <button
    class="middle none center mr-3 flex items-center justify-center rounded-lg border border-pink-500 p-3 font-sans text-xs font-bold uppercase text-pink-500 transition-all hover:opacity-75 focus:ring focus:ring-pink-200 active:opacity-[0.85] disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none text-sm"
    data-ripple-dark="true"
  >
    <i class="fas fa-heart text-lg leading-none"></i>
  </button>
  <button
    class="middle none center flex items-center justify-center rounded-lg p-3 font-sans text-xs font-bold uppercase text-pink-500 transition-all hover:bg-pink-500/10 active:bg-pink-500/30 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none text-sm"
    data-ripple-dark="true"
  >
    <i class="fas fa-heart text-lg leading-none"></i>
  </button>
</div>


<!-- stylesheet -->
<link
  rel="stylesheet"
  href="https://unpkg.com/@material-tailwind/html@latest/styles/material-tailwind.css"
/>

<!-- Font Awesome Link -->
<link
  rel="stylesheet"
  href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.2/css/all.min.css"
  integrity="sha512-HK5fgLBL+xu6dm/Ii3z4xhlSUyZgTT9tuc/hSrtw6uzJOvgRr2a9jyxxT1ely+B+xFAmJKVSTbpM/CuL7qxO8w=="
  crossorigin="anonymous"
/>

<script src="https://unpkg.com/@material-tailwind/html@latest/scripts/ripple.js"></script>
    `
},

  {
      name: "Subscribe Now",
      code: `
          <a href="#" class="flex items-center justify-center w-48 px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition duration-300 ease-in-out text-sm">
            Join
            <span class="ml-2 bg-yellow-400 px-3 py-1 rounded text-black">
              Now
            </span>
          </a>
        `
    },
    
    {
      name: "Contact Support",
      code: `
          <a href="#" class="flex items-center justify-center w-48 px-6 py-3 bg-gray-800 text-white font-bold rounded-lg hover:bg-gray-900 transition duration-300 ease-in-out text-sm">
            Help
            <span class="ml-2 bg-red-500 px-3 py-1 rounded text-white">
              Desk
            </span>
          </a>
        `
    },
    {
      name: "Chatbot Button",
      code: `
          <div class="flex flex-col items-center gap-4 mb-6">
            <button class="mt-4 px-4 py-2 border border-gray-400 rounded-lg hover:bg-blue-500 hover:text-white transition duration-200 ease-in-out focus:outline-none text-sm">
              View Chatbot
            </button>
          </div>
         
        `
    },
    {
      name: "Heart Button",
      code: `
          <button class="text-pink-500 background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150" type="button">
            <i class="fas fa-heart"></i>
          </button>
        `
    },
    
  {
      name: "Erotic Button",
      code: `<a href="#" class="flex items-center justify-center w-48 px-11 py-3 bg-black text-white font-bold rounded-lg hover:bg-gray-900 transition duration-300 ease-in-out text-sm">
            Porn
            <span class="ml-2 bg-orange-500 px-3 py-1 rounded text-black">
              hub
            </span>
          </a>
        `
    },
    {
      name: "Popover Button",
      code: `
<button
  data-ripple-light="true"
  data-popover-target="popover"
  class="middle none center rounded-lg bg-gradient-to-tr from-pink-600 to-pink-400 py-3 px-6 font-sans text-xs font-bold uppercase text-white shadow-md shadow-pink-500/20 transition-all hover:shadow-lg hover:shadow-pink-500/40 active:opacity-[0.85] disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none text-sm"
>
  Show Popover
</button>


<script
  type="module"
  src="https://unpkg.com/@material-tailwind/html@latest/scripts/popover.js"
></script>


        `
    },

    {
      name: "Mario Button",
      code: `
          <a href="#" class="bg-yellow-500 rounded-lg p-2 flex items-center justify-center hover:bg-red-600 transition duration-300 ease-in-out text-sm">
            <img src="https://49iw5aq3b5e3nyxk.public.blob.vercel-storage.com/MushroomMarioKart8-ckIgqDXpzJuUv8e5WPXEkFt9gYgNIy.webp" alt="Mushroom" class="px-20 mr-2 h-9  " />
          </a>
        `
    },
    { 
      name: "Create My Account", 
      code: '<button class="flex items-center justify-center w-full px-4 py-4 text-sm font-bold leading-6 capitalize duration-100 transform border-2 rounded-sm cursor-pointer border-green-300 focus:ring-4 focus:ring-green-500 focus:ring-opacity-50 focus:outline-none sm:w-auto sm:px-6 border-text hover:shadow-lg hover:-translate-y-1">Create My Account</button>'
    },
    { 
      name: "Instagram Button", 
      code: '<button class="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-full text-sm">Instagram Button</button>'
    },
    {
      name: "Hover Center Effect",
      code: `
         <button class="relative h-12 w-40 overflow-hidden border border-indigo-600 text-indigo-600 shadow-2xl transition-all duration-200 before:absolute before:bottom-0 before:left-0 before:right-0 before:top-0 before:m-auto before:h-0 before:w-0 before:rounded-sm before:bg-indigo-600 before:duration-300 before:ease-out hover:text-white hover:shadow-indigo-600 hover:before:h-40 hover:before:w-40 hover:before:opacity-80 text-sm">
      <span class="relative z-10">Center Hover</span>
    </button>
        `
    },
    {
      name: "Fancy Button",
      code: `
         
            <button class="bg-gradient-to-b w-max mx-auto text-blue-500 font-semibold from-slate-50 to-blue-100 px-10 py-3 rounded-2xl shadow-blue-400 shadow-md border-b-4 hover:border-b hover:shadow-sm transition-all duration-500 text-sm">
              Fancy button
            </button>
         
        `
    },
    { 
      name: "AI Animated Button", 
      code: '<button class="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-full transition duration-300 ease-in-out transform hover:scale-105 animate-pulse text-sm">AI Animated Button</button>'
    },
    { 
      name: "Primary Action", 
      code: '<button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm">Primary Action</button>'
    },
  
    {
      name: "Blue Button",
      code: `
          <button class="rounded-full bg-blue-500 px-12 py-3 text-sm mb-3 font-medium text-white transition duration-200 hover:bg-blue-600 active:bg-blue-700">
            Blue
          </button>
        `
    },
    {
      name: "Outlined Red Button",
      code: `
          <button class="rounded-xl border-2 border-red-500 px-12 py-3 text-sm mb-3 font-medium text-red-500 transition duration-200 hover:bg-red-600/5 active:bg-red-700/5">
            Red
          </button>
        `
    },
    {
      name: "Gradient Button",
      code: `
          <button class="rounded-xl bg-gradient-to-br from-[#6025F5] to-[#FF5555] px-12 py-3 text-sm font-medium text-white transition duration-200 hover:shadow-lg hover:shadow-[#6025F5]/50">
            Gradient
          </button>
        `
    },
    { 
      name: "Secondary Action", 
      code: '<button class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-full text-sm">Secondary Action</button>'
    },
    { 
      name: "Success", 
      code: '<button class="bg-green-500 hover:bg-green-700 text-white font-semibold py-2 px-4 border border-green-500 rounded text-sm">Success</button>'
    },
    { 
      name: "Danger", 
      code: '<button class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded inline-flex items-center text-sm">Danger</button>'
    },
    { 
      name: "Warning", 
      code: '<button class="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-lg text-sm">Warning</button>'
    },
    { 
      name: "Rainbow Glow", 
      code: '<button class="relative inline-flex items-center justify-center px-8 py-4 text-sm font-bold text-white bg-gradient-to-r from-[#44BCFF] via-[#FF44EC] to-[#FF675E] rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900">Rainbow Glow</button>'
    },
    { 
      name: "Info", 
      code: '<button class="bg-cyan-500 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-xl text-sm">Info</button>'
    },
    { 
      name: "Outline", 
      code: '<button class="bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded text-sm">Outline</button>'
    },
    { 
      name: "Disabled", 
      code: '<button class="bg-gray-300 text-gray-500 font-bold py-2 px-4 rounded opacity-50 cursor-not-allowed text-sm" disabled>Disabled</button>'
    },
    { 
      name: "Link", 
      code: '<button class="bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 text-sm">Link</button>'
    },
    { 
      name: "Small", 
      code: '<button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-xs">Small</button>'
    },
    { 
      name: "Large", 
      code: '<button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded text-sm">Large</button>'
    },
    { 
      name: "Shine Hover Effect Button", 
      code: '<button class="before:ease relative h-12 w-40 overflow-hidden border border-green-500 bg-green-500 text-white shadow-2xl transition-all before:absolute before:right-0 before:top-0 before:h-12 before:w-6 before:translate-x-12 before:rotate-6 before:bg-white before:opacity-10 before:duration-700 hover:shadow-green-500 hover:before:-translate-x-40 text-sm">Shine</button>'
    

    },
    { 
      name: "Full Width", 
      code: '<button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full text-sm">Full Width</button>'
    },
    { 
      name: "Submit Proposal", 
      code: '<button class="bg-gradient-to-r from-green-400 to-blue-500 hover:from-blue-500 hover:to-green-400 text-white font-bold py-2 px-4 rounded-full shadow-lg transform hover:scale-105 transition duration-300 ease-in-out text-sm">Submit Proposal</button>'
    },
    { 
      name: "Approve Request", 
      code: '<button class="bg-green-600 hover:bg-green-800 text-white font-semibold py-2 px-6 rounded-lg inline-flex items-center text-sm">Approve Request</button>'
    },
    { 
      name: "Launch Campaign", 
      code: '<button class="bg-purple-600 hover:bg-purple-800 text-white font-bold py-3 px-6 rounded-full shadow-md hover:shadow-xl transition-shadow duration-300 text-sm">Launch Campaign</button>'
    },
    { 
      name: "Sign Contract", 
      code: '<button class="bg-gray-800 hover:bg-gray-900 text-white font-medium py-2 px-5 rounded-md border border-gray-700 text-sm">Sign Contract</button>'
    },
    
      {
        name: "Curtain Hover Button",
        code: `
          <button class="relative h-[50px] w-40 overflow-hidden border border-pink-400 bg-white text-pink-400 shadow-2xl transition-all before:absolute before:left-0 before:top-0 before:h-full before:w-0 before:duration-500 after:absolute after:right-0 after:top-0 after:h-full after:w-0 after:duration-500 hover:text-white hover:shadow-pink-400 hover:before:w-2/4 hover:before:bg-pink-400 hover:after:w-2/4 hover:after:bg-pink-400 text-sm">
            <span class="relative z-10">Curtain</span>
          </button>
        `
      },
      {
        name: "Smoosh Hover Button",
        code: `
          <button class="relative h-[50px] w-40 overflow-hidden border border-green-900 bg-white text-green-900 shadow-2xl transition-all before:absolute before:left-0 before:right-0 before:top-0 before:h-0 before:w-full before:bg-green-900 before:duration-500 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0 after:w-full after:bg-green-900 after:duration-500 hover:text-white hover:shadow-green-900 hover:before:h-2/4 hover:after:h-2/4 text-sm">
            <span class="relative z-10">Smoosh</span>
          </button>
        `
      },
      {
        name: "Alternate Hover Button",
        code: `
          <button class="group relative min-h-[50px] w-40 overflow-hidden border border-purple-500 bg-white text-purple-500 shadow-2xl transition-all before:absolute before:left-0 before:top-0 before:h-0 before:w-1/4 before:bg-purple-500 before:duration-500 after:absolute after:bottom-0 after:right-0 after:h-0 after:w-1/4 after:bg-purple-500 after:duration-500 hover:text-white hover:before:h-full hover:after:h-full text-sm">
            <span class="top-0 flex h-full w-full items-center justify-center before:absolute before:bottom-0 before:left-1/4 before:z-0 before:h-0 before:w-1/4 before:bg-purple-500 before:duration-500 after:absolute after:right-1/4 after:top-0 after:z-0 after:h-0 after:w-1/4 after:bg-purple-500 after:duration-500 hover:text-white group-hover:before:h-full group-hover:after:h-full"></span>
            <span class="absolute bottom-0 left-0 right-0 top-0 z-10 flex h-full w-full items-center justify-center group-hover:text-white">Alternate</span>
          </button>
        `
      },
    
    
    { 
      name: "Investor Relations", 
      code: '<button class="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded shadow-inner text-sm">Investor Relations</button>'
    },
    { 
      name: "Business Intelligence", 
      code: '<button class="bg-blue-700 hover:bg-blue-900 text-white font-semibold py-2 px-6 rounded-xl tracking-wide text-sm">Business Intelligence</button>'
    },
    { 
      name: "Data Analytics", 
      code: '<button class="bg-blue-600 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded-md border-b-4 border-blue-800 text-sm">Data Analytics</button>'
    },
    { 
      name: "Project Management", 
      code: '<button class="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded shadow-lg transform hover:-translate-y-1 hover:scale-110 transition duration-300 text-sm">Project Management</button>'
    },
    {
      name: "Red Rounded Button",
      code: `
      <button class='relative inline-flex items-center justify-center p-0.5 mb-2 mr-2 overflow-hidden text-sm text-red-600 font-semibold rounded-lg group bg-gradient-to-br from-red-500 to-red-400 group-hover:from-red-500 group-hover:to-red-400 hover:text-white'>
          <span class='relative py-2 px-5 transition-all ease-in duration-75 bg-white rounded-lg group-hover:bg-opacity-0'> Button </span>
      </button>
      `,
  },
  {
      name: "Green Rounded Button",
      code: `
      <button class='relative inline-flex items-center justify-center p-0.5 mb-2 mr-2 overflow-hidden text-sm text-green-600 font-semibold rounded-lg group bg-gradient-to-br from-green-500 to-green-400 group-hover:from-green-500 group-hover:to-green-400 hover:text-white'>
          <span class='relative py-2 px-5 transition-all ease-in duration-75 bg-white rounded-lg group-hover:bg-opacity-0'> Button </span>
      </button>
      `,
  },
  {
      name: "Blue Rounded Button",
      code: `
      <button class='relative inline-flex items-center justify-center p-0.5 mb-2 mr-2 overflow-hidden text-sm text-blue-600 font-semibold rounded-lg group bg-gradient-to-br from-blue-500 to-blue-400 group-hover:from-blue-500 group-hover:to-blue-400 hover:text-white'>
          <span class='relative py-2 px-5 transition-all ease-in duration-75 bg-white rounded-lg group-hover:bg-opacity-0'> Button </span>
      </button>
      `,
  },    
  {
    name: "Swipe Effect Button",
    code: `
   <button class="text-red hover:before:bg-redborder-red-500 relative h-[50px] w-40 overflow-hidden border border-red-500 bg-white px-3 text-red-500 shadow-2xl transition-all before:absolute before:bottom-0 before:left-0 before:top-0 before:z-0 before:h-full before:w-0 before:bg-red-500 before:transition-all before:duration-500 hover:text-white hover:shadow-red-500 hover:before:left-0 hover:before:w-full text-sm"><span class="relative z-10">Swipe</span></button>
    `,
},
  {
      name: "Purple Rounded Button",
      code: `
      <button class='relative inline-flex items-center justify-center p-0.5 mb-2 mr-2 overflow-hidden text-sm text-purple-600 font-semibold rounded-lg group bg-gradient-to-br from-purple-500 to-purple-400 group-hover:from-purple-500 group-hover:to-purple-400 hover:text-white'>
          <span class='relative py-2 px-5 transition-all ease-in duration-75 bg-white rounded-lg group-hover:bg-opacity-0'> Button </span>
      </button>
      `,
  },
  {
      name: "Orange Rounded Button",
      code: `
      <button class='relative inline-flex items-center justify-center p-0.5 mb-2 mr-2 overflow-hidden text-sm text-orange-600 font-semibold rounded-lg group bg-gradient-to-br from-orange-500 to-orange-400 group-hover:from-orange-500 group-hover:to-orange-400 hover:text-white'>
          <span class='relative py-2 px-5 transition-all ease-in duration-75 bg-white rounded-lg group-hover:bg-opacity-0'> Button </span>
      </button>
      `,
  },
  
    { 
      name: "Financial Report", 
      code: '<button class="bg-gray-600 hover:bg-gray-800 text-white font-medium py-2 px-5 rounded-md border-t-4 border-b-4 border-gray-900 text-sm">Financial Report</button>'
    },
    { 
      name: "Sales Dashboard", 
      code: '<button class="bg-pink-500 hover:bg-pink-700 text-white font-semibold py-2 px-6 rounded-full shadow-md text-sm">Sales Dashboard</button>'
    },
    { 
      name: "Elevated Launch", 
      code: '<button class="relative inline-block h-full w-full rounded border-2 border-purple-500 bg-white px-3 py-1 text-base font-bold text-purple-500 transition duration-100 hover:bg-purple-500 hover:text-white text-sm">Elevated Launch</button>'
    },
    { 
      name: "Elevated Sign In", 
      code: '<button class="relative inline-block h-full w-full rounded border-2 border-indigo-500 bg-white px-3 py-1 text-base font-bold text-indigo-500 transition duration-100 hover:bg-indigo-500 hover:text-white text-sm">Elevated Sign In</button>'
    },
    { 
      name: "Elevated Download", 
      code: '<button class="relative inline-block h-full w-full rounded border-2 border-gray-600 bg-white px-3 py-1 text-base font-bold text-gray-600 transition duration-100 hover:bg-gray-600 hover:text-white text-sm">Elevated Download</button>'
    },
    { 
      name: "Elevated Subscribe", 
      code: '<button class="relative inline-block h-full w-full rounded border-2 border-pink-500 bg-white px-3 py-1 text-base font-bold text-pink-500 transition duration-100 hover:bg-pink-500 hover:text-white text-sm">Elevated Subscribe</button>'
    },
    { 
      name: "Elevated Contact Us", 
      code: '<button class="relative inline-block h-full w-full rounded border-2 border-teal-500 bg-white px-3 py-1 text-base font-bold text-teal-500 transition duration-100 hover:bg-teal-500 hover:text-white text-sm">Elevated Contact Us</button>'
    },
    { 
      name: "Customer Insights", 
      code: '<button class="bg-green-700 hover:bg-green-700 text-white font-thin py-2 px-4 rounded-full uppercase tracking-wide text-sm">Customer Insights</button>'
    },
   
    { 
      name: "Partner Portal", 
      code: '<button class="bg-purple-500 hover:bg-purple-700 text-white font-semibold py-2 px-5 rounded-lg border-l-4 border-purple-800 text-sm">Partner Portal</button>'
    },
    {
      name: "Login-Register Button",
      code: `
        <div class="flex items-center justify-center">
          <div class="border w-fit rounded-xl m-5 shadow-sm">
            <button class="px-4 py-2 rounded-l-xl text-white m-0 bg-red-500 hover:bg-red-600 transition text-sm">
              Login
            </button>
            <button class="px-4 py-2 rounded-r-xl bg-neutral-50 hover:bg-neutral-100 transition text-sm">
              Register
            </button>
          </div>
        </div>
      `
    },
    { 
      name: "Supply Chain", 
      code: '<button class="bg-blue-400 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-full inline-flex items-center animate-pulse text-sm">Supply Chain</button>'
    },
    { 
      name: "Resource Allocation", 
      code: '<button class="bg-indigo-600 hover:bg-indigo-800 text-white font-bold py-2 px-6 rounded-xl shadow-inner text-sm">Resource Allocation</button>'
    },
    { 
      name: "Risk Assessment", 
      code: '<button class="bg-red-600 hover:bg-red-800 text-white font-bold py-2 px-4 rounded-md border-dashed border-2 border-white text-sm">Risk Assessment</button>'
    },
    { 
      name: "Minecraft Play Now", 
      code: '<button class="bg-green-600 hover:bg-green-800 text-white font-bold py-2 px-4 rounded text-sm">Minecraft Play Now</button>'
    },
    { 
      name: "Tetris Start Game", 
      code: '<button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm">Tetris Start Game</button>'
    },
    { 
      name: "Super Mario Jump In", 
      code: '<button class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded text-sm">Super Mario Jump In</button>'
    },
    { 
      name: "The Legend of Zelda Begin Quest", 
      code: '<button class="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded text-sm">The Legend of Zelda Begin Quest</button>'
    },
    { 
      name: "Pac-Man Play Now", 
      code: '<button class="bg-yellow-400 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded text-sm">Pac-Man Play Now</button>'
    },
    { 
      name: "Quality Assurance", 
      code: '<button class="bg-green-400 hover:bg-green-600 text-white font-semibold py-2 px-5 rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-200 text-sm">Quality Assurance</button>'
    },
    { 
      name: "Compliance Check", 
      code: '<button class="bg-yellow-600 hover:bg-yellow-800 text-white font-medium py-2 px-4 rounded-md border-b-4 border-yellow-800 text-sm">Compliance Check</button>'
    },
    { 
      name: "Executive Summary", 
      code: '<button class="bg-gray-700 hover:bg-gray-900 text-white font-bold py-3 px-7 rounded-full uppercase tracking-widest text-sm">Executive Summary</button>'
    },
    { 
      name: "Product Roadmap", 
      code: '<button class="bg-teal-600 hover:bg-teal-800 text-white font-semibold py-2 px-5 rounded-md shadow-lg hover:shadow-xl transition-shadow duration-300 text-sm">Product Roadmap</button>'
    },
    { 
      name: "Team Collaboration", 
      code: '<button class="bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-6 rounded-lg animate-bounce text-sm">Team Collaboration</button>'
    },
    { 
      name: "Innovation Lab", 
      code: '<button class="bg-purple-600 hover:bg-purple-800 text-white font-medium py-2 px-4 rounded-full transform hover:rotate-3 hover:scale-105 transition duration-300 text-sm">Innovation Lab</button>'
    },
    { 
      name: "Rounded Primary Button", 
      code: '<button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm">Rounded Primary Button</button>'
    },
    { 
      name: "Rounded Danger Button", 
      code: '<button class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded text-sm">Rounded Danger Button</button>'
    },
    { 
      name: "Rounded Success Button", 
      code: '<button class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-sm">Rounded Success Button</button>'
    },
    { 
      name: "Outline Primary Button", 
      code: '<button class="border border-blue-500 text-blue-500 font-bold py-2 px-4 rounded text-sm">Outline Primary Button</button>'
    },
    { 
      name: "Outline Danger Button", 
      
      code: '<button class="border border-red-500 text-red-500 font-bold py-2 px-4 rounded text-sm">Outline Danger Button</button>'
    },
    { 
      name: "Outline Success Button", 
      code: '<button class="border border-green-500 text-green-500 font-bold py-2 px-4 rounded text-sm">Outline Success Button</button>'
    },
    { 
      name: "Gradient Warm Sunset", 
      code: '<button class="bg-gradient-to-r from-red-400 to-yellow-500 text-white font-bold py-2 px-4 rounded text-sm">Gradient Warm Sunset</button>'
    },
    { 
      name: "Gradient Cool Breeze", 
      code: '<button class="bg-gradient-to-r from-blue-400 to-indigo-500 text-white font-bold py-2 px-4 rounded text-sm">Gradient Cool Breeze</button>'
    },
    { 
      name: "Gradient Nature Blend", 
      code: '<button class="bg-gradient-to-r from-green-400 to-blue-500 text-white font-bold py-2 px-4 rounded text-sm">Gradient Nature Blend</button>'
    },
    { 
      name: "Growth Strategy", 
      code: '<button class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg border-l-4 border-green-800 text-sm">Growth Strategy</button>'
    },
    { 
      name: "Performance Metrics", 
      code: '<button class="bg-blue-500 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-md shadow-md hover:shadow-lg transition-shadow duration-200 text-sm">Performance Metrics</button>'
    },
    { 
      name: "Revenue Forecast", 
      code: '<button class="bg-gray-600 hover:bg-gray-800 text-white font-bold py-2 px-5 rounded-full uppercase tracking-wide text-sm">Revenue Forecast</button>'
    },
    { 
      name: "Budget Planning", 
      code: '<button class="bg-yellow-500 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded-md border-dotted border-2 border-yellow-800 text-sm">Budget Planning</button>'
    },
    { 
      name: "Human Resources", 
      code: '<button class="bg-pink-600 hover:bg-pink-800 text-white font-bold py-2 px-6 rounded-lg inline-flex items-center text-sm">Human Resources</button>'
    },
    { 
      name: "Talent Acquisition", 
      code: '<button class="bg-indigo-500 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-full animate-pulse text-sm">Talent Acquisition</button>'
    },
    { 
      name: "Brand Management", 
      code: '<button class="bg-red-500 hover:bg-red-700 text-white font-semibold py-2 px-5 rounded-md shadow-inner text-sm">Brand Management</button>'
    },
    { 
      name: "Google Search Button", 
      code: '<button class="bg-gradient-to-r from-blue-500 via-red-500 to-yellow-500 text-white font-bold py-2 px-4 rounded text-sm">Google Search Button</button>'
    },
    { 
      name: "Facebook Connect Button", 
      code: '<button class="bg-blue-600 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded text-sm">Facebook Connect Button</button>'
    },
    { 
      name: "Amazon Buy Now Button", 
      code: '<button class="bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded text-sm">Amazon Buy Now Button</button>'
    },
    { 
      name: "Apple Learn More Button", 
      code: '<button class="bg-gray-800 hover:bg-gray-900 text-white font-bold py-2 px-4 rounded text-sm">Apple Learn More Button</button>'
    },
    { 
      name: "Microsoft Start Button", 
      code: '<button class="bg-gradient-to-r from-red-500 via-green-500 to-blue-500 text-white font-bold py-2 px-4 rounded text-sm">Microsoft Start Button</button>'
    },
    { 
      name: "Netflix Watch Now Button", 
      code: '<button class="bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-4 rounded text-sm">Netflix Watch Now Button</button>'
    },
    { 
      name: "Twitter Tweet Button", 
      code: '<button class="bg-blue-400 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded text-sm">Twitter Tweet Button</button>'
    },
    { 
      name: "Uber Ride Now Button", 
      code: '<button class="bg-black hover:bg-gray-800 text-white font-bold py-2 px-4 rounded text-sm">Uber Ride Now Button</button>'
    },
    { 
      name: "Airbnb Book Now Button", 
      code: '<button class="bg-pink-500 hover:bg-pink-700 text-white font-bold py-2 px-4 rounded text-sm">Airbnb Book Now Button</button>'
    },
    { 
      name: "Spotify Play Button", 
      code: '<button class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-sm">Spotify Play Button</button>'
    },
    { 
      name: "Global Operations", 
      code: '<button class="bg-blue-700 hover:bg-blue-900 text-white font-bold py-3 px-7 rounded-full uppercase text-sm">Global Operations</button>'
    },
    { 
      name: "Client Onboarding", 
      code: '<button class="bg-green-600 hover:bg-green-800 text-white font-medium py-2 px-5 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 text-sm">Client Onboarding</button>'
    },
    { 
      name: "Support Ticket", 
      code: '<button class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md border-t-4 border-gray-800 text-sm">Support Ticket</button>'
    },
    { 
      name: "Schedule Meeting", 
      code: '<button class="bg-purple-500 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-full transform hover:scale-110 transition duration-300 text-sm">Schedule Meeting</button>'
    },
    { 
      name: "Feedback Form", 
      code: '<button class="bg-teal-500 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm text-sm">Feedback Form</button>'
    },
    { 
      name: "Policy Update", 
      code: '<button class="bg-yellow-600 hover:bg-yellow-800 text-white font-bold py-2 px-5 rounded-md border-b-4 border-yellow-800 text-sm">Policy Update</button>'
    },
    { 
      name: "Order Now", 
      code: '<button class="bg-red-500 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-full shadow-lg animate-bounce text-sm">Order Now</button>'
    },
    { 
      name: "Join Webinar", 
      code: '<button class="bg-blue-600 hover:bg-blue-800 text-white font-semibold py-2 px-4 rounded-lg animate-pulse text-sm">Join Webinar</button>'
    },
    { 
      name: "Download Report", 
      code: '<button class="bg-green-500 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-md shadow-md text-sm">Download Report</button>'
    },
    {
      name: "Shop Now Button",
      code: `
      <button class="flex items-center justify-center px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition duration-300 ease-in-out text-sm">
          Shop Now
          <svg xmlns="http://www.w3.org/2000/svg" class="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12h-6m6 0l-3-3m3 3l-3 3"/>
          </svg>
      </button>
      `
  },
  {
      name: "Learn More Button",
      code: `
      <a href="#" class="flex items-center justify-center w-full px-4 py-3 bg-blue-800 text-white font-semibold rounded-lg hover:bg-blue-700 transition duration-300 ease-in-out text-sm">
          Learn More
          <span class="ml-2 text-blue-300">→</span>
      </a>
      `
  },
  {
      name: "Get Started Button",
      code: `
      <button class="flex items-center justify-center w-48 px-4 py-2 bg-orange-500 text-white font-bold rounded-full hover:bg-orange-600 transition duration-300 ease-in-out text-sm">
          Get Started
      </button>
      `
  },
  {
      name: "Logout Button",
      code: `
      <button class="flex items-center justify-center w-40 px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition duration-300 ease-in-out text-sm">
          Logout
          <svg xmlns="http://www.w3.org/2000/svg" class="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12h-6m6 0l-3-3m3 3l-3 3"/>
          </svg>
      </button>
      `
  },
  {
      name: "Download Button",
      code: `
      <a href="#" class="flex items-center justify-center w-48 px-4 py-2 bg-purple-600 text-white font-bold text-sm rounded-lg hover:bg-purple-700 transition duration-300 ease-in-out">
          Download
          <svg xmlns="http://www.w3.org/2000/svg" class="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v9m0 0l-3-3m3 3l3-3m8 12H4"/>
          </svg>
      </a>
      `
  },
  {
    name: "Facebook Button",
    code: `
    <button type="button" class="flex items-center justify-center w-48 px-4 py-2 bg-[#3b5998] text-white text-sm  font-medium rounded-lg hover:bg-[#3b5998]/90 transition duration-300 ease-in-out">
        Sign in with Facebook
        <svg class="ml-2 w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 8 19">
            <path fill-rule="evenodd" d="M6.135 3H8V0H6.135a4.147 4.147 0 0 0-4.142 4.142V6H0v3h2v9.938h3V9h2.021l.592-3H5V3.591A.6.6 0 0 1 5.592 3h.543Z" clip-rule="evenodd"/>
        </svg>
    </button>
    `,
},
{
    name: "Twitter Button",
    code: `
    <button type="button" class="flex items-center justify-center w-48 px-4 py-2 bg-[#1da1f2] text-white text-sm  font-medium rounded-lg hover:bg-[#1da1f2]/90 transition duration-300 ease-in-out">
        Sign in with Twitter
        <svg class="ml-2 w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 17">
            <path fill-rule="evenodd" d="M20 1.892a8.178 8.178 0 0 1-2.355.635 4.074 4.074 0 0 0 1.8-2.235 8.344 8.344 0 0 1-2.605.98A4.13 4.13 0 0 0 13.85 0a4.068 4.068 0 0 0-4.1 4.038 4 4 0 0 0 .105.919A11.705 11.705 0 0 1 1.4.734a4.006 4.006 0 0 0 1.268 5.392 4.165 4.165 0 0 1-1.859-.5v.05A4.057 4.057 0 0 0 4.1 9.635a4.19 4.19 0 0 1-1.856.07 4.108 4.108 0 0 0 3.831 2.807A8.36 8.36 0 0 1 0 14.184 11.732 11.732 0 0 0 6.291 16 11.502 11.502 0 0 0 17.964 4.5c0-.177 0-.35-.012-.523A8.143 8.143 0 0 0 20 1.892Z" clip-rule="evenodd"/>
        </svg>
    </button>
    `,
},
{
    name: "Github Button",
    code: `
    <button type="button" class="flex items-center justify-center w-48 px-4 py-2 bg-[#24292F] text-white text-sm  font-medium rounded-lg hover:bg-[#24292F]/90 transition duration-300 ease-in-out">
        Sign in with Github
        <svg class="ml-2 w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 .333A9.911 9.911 0 0 0 6.866 19.65c.5.092.678-.215.678-.477 0-.237-.01-1.017-.014-1.845-2.757.6-3.338-1.169-3.338-1.169a2.627 2.627 0 0 0-1.1-1.451c-.9-.615.07-.6.07-.6a2.084 2.084 0 0 1 1.518 1.021 2.11 2.11 0 0 0 2.884.823c.044-.503.268-.973.63-1.325-2.2-.25-4.516-1.1-4.516-4.9A3.832 3.832 0 0 1 4.7 7.068a3.56 3.56 0 0 1 .095-2.623s.832-.266 2.726 1.016a9.409 9.409 0 0 1 4.962 0c1.89-1.282 2.717-1.016 2.717-1.016.366.83.402 1.768.1 2.623a3.827 3.827 0 0 1 1.02 2.659c0 3.807-2.319 4.644-4.525 4.889a2.366 2.366 0 0 1 .673 1.834c0 1.326-.012 2.394-.012 2.72 0 .263.18.572.681.475A9.911 9.911 0 0 0 10 .333Z" clip-rule="evenodd"/>
        </svg>
    </button>
    `,
},
{
    name: "Google Button",
    code: `
    <button type="button" class="flex items-center justify-center w-48 px-4 py-2 bg-[#4285F4] text-white text-sm font-medium rounded-lg hover:bg-[#4285F4]/90 transition duration-300 ease-in-out">
        Sign in with Google
        <svg class="ml-2 w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 18 19">
            <path fill-rule="evenodd" d="M8.842 18.083a8.8 8.8 0 0 1-8.65-8.948 8.841 8.841 0 0 1 8.8-8.652h.153a8.464 8.464 0 0 1 5.7 2.257l-2.193 2.038A5.27 5.27 0 0 0 9.09 3.4a5.882 5.882 0 0 0-.2 11.76h.124a5.091 5.091 0 0 0 5.248-4.057L14.3 11H9V8h8.34c.066.543.095 1.09.088 1.636-.086 5.053-3.463 8.449-8.4 8.449l-.186-.002Z" clip-rule="evenodd"/>
        </svg>
    </button>
    `,
},
{
    name: "Apple Button",
    code: `
    <button type="button" class="flex items-center justify-center w-48 px-4 py-2 bg-[#050708] text-white text-sm font-medium rounded-lg hover:bg-[#050708]/90 transition duration-300 ease-in-out">
        Sign in with Apple
        <svg class="ml-2 w-5 h-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="apple" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
            <path fill="currentColor" d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"></path>
        </svg>
    </button>
    `,
},
{
  name: "Add to Cart Button",
  code: `
  <button type="button" class="py-3 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none">
      Add to cart
      <svg class="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m5 11 4-7"></path>
          <path d="m19 11-4-7"></path>
          <path d="M2 11h20"></path>
          <path d="m3.5 11 1.6 7.4a2 2 0 0 0 2 1.6h9.8c.9 0 1.8-.7 2-1.6l1.7-7.4"></path>
          <path d="m9 11 1 9"></path>
          <path d="M4.5 15.5h15"></path>
          <path d="m15 11-1 9"></path>
      </svg>
  </button>
  `,
},
{
  name: "Signup Free Button",
  code: `
  <button type="button" class="py-3 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 focus:outline-none focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-700 dark:focus:bg-neutral-700">
      Signup free
      <svg class="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 12h14"></path>
          <path d="m12 5 7 7-7 7"></path>
      </svg>
  </button>
  `,
},
{
"name": "YouTube Button",
"code": "<button class=\"bg-white transform hover:-translate-y-3 border-2 w-12 h-12 rounded-full duration-500 text-red-500 border-red-500 hover:bg-red-500 hover:text-white text-sm\"><i class=\"fab fa-youtube\"></i></button>"
},
{
"name": "Snapchat Button",
"code": "<button class=\"bg-white transform hover:-translate-y-3 border-2 w-12 h-12 rounded-full duration-500 text-yellow-300 border-yellow-300 hover:bg-yellow-300 hover:text-white text-sm\"><i class=\"fab fa-snapchat-ghost\"></i></button>"
},
{
"name": "LinkedIn Button",
"code": "<button class=\"bg-white transform hover:-translate-y-3 border-2 w-12 h-12 rounded-full duration-500 text-blue-500 border-blue-500 hover:bg-blue-500 hover:text-white text-sm\"><i class=\"fab fa-linkedin-in\"></i></button>"
},
{
"name": "TikTok Button",
"code": "<button class=\"bg-white transform hover:-translate-y-3 border-2 w-12 h-12 rounded-full duration-500 text-black border-black hover:bg-black hover:text-white text-sm\"><i class=\"fab fa-tiktok\"></i></button>"
},
{
"name": "Telegram Button",
"code": "<button class=\"bg-white transform hover:-translate-y-3 border-2 w-12 h-12 rounded-full duration-500 text-blue-400 border-blue-400 hover:bg-blue-400 hover:text-white text-sm\"><i class=\"fab fa-telegram-plane\"></i></button>"
},
{
"name": "Pinterest Button",
"code": "<button class=\"bg-white transform hover:-translate-y-3 border-2 w-12 h-12 rounded-full duration-500 text-red-500 border-red-500 hover:bg-red-500 hover:text-white text-sm\"><i class=\"fab fa-pinterest-p\"></i></button>"
},
{
"name": "Spotify Button",
"code": "<button class=\"bg-white transform hover:-translate-y-3 border-2 w-12 h-12 rounded-full duration-500 text-green-500 border-green-500 hover:bg-green-500 hover:text-white text-sm\"><i class=\"fab fa-spotify\"></i></button>"
},
{
"name": "Discord Button",
"code": "<button class=\"bg-white transform hover:-translate-y-3 border-2 w-12 h-12 rounded-full duration-500 text-indigo-500 border-indigo-500 hover:bg-indigo-500 hover:text-white text-sm\"><i class=\"fab fa-discord\"></i></button>"
},
{
"name": "Reddit Button",
"code": "<button class=\"bg-white transform hover:-translate-y-3 border-2 w-12 h-12 rounded-full duration-500 text-yellow-600 border-yellow-600 hover:bg-yellow-600 hover:text-white text-sm\"><i class=\"fab fa-reddit-alien\"></i></button>"
},
{
"name": "Google Plus Button",
"code": "<button class=\"bg-white transform hover:-translate-y-3 border-2 w-12 h-12 rounded-full duration-500 text-red-500 border-red-500 hover:bg-red-500 hover:text-white text-sm\"><i class=\"fab fa-google-plus-g\"></i></button>"
},
{
"name": "Skype Button",
"code": "<button class=\"bg-white transform hover:-translate-y-3 border-2 w-12 h-12 rounded-full duration-500 text-blue-400 border-blue-400 hover:bg-blue-400 hover:text-white text-sm\"><i class=\"fab fa-skype\"></i></button>"
},
{
"name": "Line Button",
"code": "<button class=\"bg-white transform hover:-translate-y-3 border-2 w-12 h-12 rounded-full duration-500 text-green-400 border-green-400 hover:bg-green-400 hover:text-white text-sm\"><i class=\"fab fa-line\"></i></button>"
},
{
name: "This is all",
code: `
<button
type="button"
class="inline-block rounded bg-blue-700 px-6 pb-2 pt-2.5 text-sm font-medium uppercase leading-normal text-white shadow-primary-3 transition duration-150 ease-in-out hover:bg-primary-accent-300 hover:shadow-primary-2 focus:bg-primary-accent-300 focus:shadow-primary-2 focus:outline-none focus:ring-0 active:bg-primary-600 active:shadow-primary-2 motion-reduce:transition-none dark:shadow-black/30 dark:hover:shadow-dark-strong dark:focus:shadow-dark-strong dark:active:shadow-dark-strong">
That is all folks!
</button>
`,
}
]

export default function BusinessButtons() {
  const { isPremium } = useSubscription();

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const copyToClipboard = useCallback(
    async (text: string, index: number) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopiedIndex(index);

        setTimeout(() => {
          setCopiedIndex(null);
        }, 2000);
      } catch (error) {
        console.error("Failed to copy:", error);
      }
    },
    []
  );

  const saveButton = useCallback(
    async (
      button: { name: string; code: string },
      index: number
    ) => {
      if (!isPremium) {
        setShowPremiumModal(true);
        return;
      }

      setSavingIndex(index);

      try {
        const response = await fetch("/api/save-button", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(button),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to save button");
        }
      } catch (error) {
        console.error("Failed to save button:", error);
      } finally {
        setSavingIndex(null);
      }
    },
    [isPremium]
  );

  const handleCardClick = () => {
    if (!isPremium) {
      setShowPremiumModal(true);
    }
  };

  return (
    <>
      <div className="container mx-auto mt-11 px-4 py-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {buttonStyles.map((button, index) => (
            <Card
              key={index}
              onClick={handleCardClick}
              className={`
                group relative overflow-hidden
                rounded-2xl
                border border-gray-200/80
                bg-white
                shadow-sm
                transition-all duration-300 ease-out
                hover:-translate-y-1
                hover:border-gray-300
                hover:shadow-[0_18px_45px_-20px_rgba(0,0,0,0.25)]
                ${!isPremium ? "cursor-pointer" : ""}
              `}
            >
              {/* Subtle top accent */}
              <div
                className="
                  absolute inset-x-0 top-0 z-10 h-[2px]
                  bg-gradient-to-r
                  from-transparent
                  via-gray-400/60
                  to-transparent
                  opacity-0
                  transition-opacity duration-300
                  group-hover:opacity-100
                "
              />

              {/* Header */}
              <CardHeader
                className="
                  border-b border-gray-100
                  bg-gradient-to-b from-gray-50/90 to-white
                  px-5 py-4
                "
              >
                <div className="flex items-center justify-between gap-3">
                  <CardTitle
                    className="
                      truncate
                      text-[11px]
                      font-semibold
                      uppercase
                      tracking-[0.14em]
                      text-gray-800
                      transition-colors duration-300
                      group-hover:text-black
                    "
                  >
                    {button.name}
                  </CardTitle>

                  {/* Status indicator */}
                  <span
                    className="
                      h-1.5 w-1.5 shrink-0
                      rounded-full
                      bg-gray-300
                      transition-all duration-300
                      group-hover:bg-black
                      group-hover:shadow-[0_0_0_4px_rgba(0,0,0,0.06)]
                    "
                  />
                </div>
              </CardHeader>

              {/* Content */}
              <CardContent className="p-4">
                <div className="flex flex-col gap-4">
                  {/* Live component preview */}
                  <div
                    className="
                      relative
                      flex min-h-[145px]
                      items-center justify-center
                      overflow-hidden
                      rounded-xl
                      border border-gray-100
                      bg-[#fafafa]
                      p-6
                      transition-all duration-300
                      group-hover:border-gray-200
                      group-hover:bg-gray-50
                    "
                  >
                    {/* Background grid */}
                    <div
                      className="
                        pointer-events-none
                        absolute inset-0
                        opacity-[0.035]
                        [background-image:linear-gradient(#000_1px,transparent_1px),linear-gradient(90deg,#000_1px,transparent_1px)]
                        [background-size:18px_18px]
                      "
                    />

                    {/* Preview */}
                    <div className="relative z-10">
                      <div
                        dangerouslySetInnerHTML={{
                          __html: button.code,
                        }}
                      />
                    </div>
                  </div>
                </div>
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
            </Card>
          ))}
        </div>
      </div>

      {/* Premium Modal */}
      <PremiumRequiredModal
        open={showPremiumModal}
        onOpenChange={setShowPremiumModal}
      />
    </>
  );
}

