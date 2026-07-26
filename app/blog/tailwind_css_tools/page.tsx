"use client"
import Header from "@/components/header2"

export default function Tools(){
return (
    <>  <Header/>
    <div className="mt-14 container mx-auto p-8 bg-white rounded-lg shadow-md">
        <header className="mb-8">
            <h1 className="text-4xl font-bold text-gray-800">Comprehensive Guide to Tailwind CSS Tools</h1>
            <p className="text-gray-600 mt-2">Unlock the full potential of your development workflow with essential Tailwind CSS tools and resources.</p>
        </header>
        <section className="mb-8">
            <h2 className="text-3xl font-semibold text-gray-800 mb-4">1. Tailwind Genie</h2>
            <p className="text-gray-600 mb-2">Tailwind Genie is a powerful online tool designed to simplify the creation of Tailwind CSS components and utilities. With an intuitive interface, it enables you to customize components without any coding experience.</p>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Key Features:</h3>
            <ul className="list-disc list-inside text-gray-600 mb-4">
                <li>Responsive component generation for seamless design on any device.</li>
                <li>Gradient generator for creating stunning backgrounds.</li>
                <li>Exportable code snippets to integrate directly into your projects.</li>
            </ul>
            <p className="text-blue-600 underline"><a href="https://tailwindgenie.com" target="_blank">Visit Tailwind Genie</a></p>
        </section>
        <section className="mb-8">
            <h2 className="text-3xl font-semibold text-gray-800 mb-4">2. Tailwind UI</h2>
            <p className="text-gray-600 mb-2">Tailwind UI offers a comprehensive collection of beautifully designed components built on Tailwind CSS. These pre-designed elements can help you launch your projects faster while maintaining a clean aesthetic.</p>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Key Features:</h3>
            <ul className="list-disc list-inside text-gray-600 mb-4">
                <li>Professionally designed components that are fully responsive.</li>
                <li>Components for various use cases including marketing, e-commerce, and dashboards.</li>
                <li>Easy customization to fit your brand's style and needs.</li>
            </ul>
            <p className="text-blue-600 underline"><a href="https://tailwindui.com" target="_blank">Visit Tailwind UI</a></p>
        </section>
        <section className="mb-8">
            <h2 className="text-3xl font-semibold text-gray-800 mb-4">3. Headless UI</h2>
            <p className="text-gray-600 mb-2">Headless UI is a library of unstyled, fully accessible UI components that work perfectly with Tailwind CSS. It empowers developers to create customizable and interactive interfaces without being constrained by styles.</p>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Key Features:</h3>
            <ul className="list-disc list-inside text-gray-600 mb-4">
                <li>Complete control over styling and presentation.</li>
                <li>Components designed for accessibility, enhancing the user experience.</li>
                <li>Integration with frameworks like React and Vue for dynamic applications.</li>
            </ul>
            <p className="text-blue-600 underline"><a href="https://headlessui.dev" target="_blank">Visit Headless UI</a></p>
        </section>
        <section className="mb-8">
            <h2 className="text-3xl font-semibold text-gray-800 mb-4">4. Tailwind CSS Forms</h2>
            <p className="text-gray-600 mb-2">Tailwind CSS Forms is an official plugin that provides better styles for forms, making them visually appealing while maintaining the utility-first philosophy of Tailwind CSS.</p>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Key Features:</h3>
            <ul className="list-disc list-inside text-gray-600 mb-4">
                <li>Consistent styles for all form elements such as inputs, selects, and checkboxes.</li>
                <li>Responsive and customizable, adhering to your design preferences.</li>
                <li>Built with accessibility best practices in mind, ensuring users can navigate forms with ease.</li>
            </ul>
            <p className="text-blue-600 underline"><a href="https://github.com/tailwindlabs/tailwindcss-forms" target="_blank">Visit Tailwind CSS Forms</a></p>
        </section>
        <section className="mb-8">
            <h2 className="text-3xl font-semibold text-gray-800 mb-4">5. Heroicons</h2>
            <p className="text-gray-600 mb-2">Heroicons is a set of free, high-quality SVG icons specifically crafted to complement Tailwind CSS. These icons can enhance your projects by providing clarity and visual appeal.</p>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Key Features:</h3>
            <ul className="list-disc list-inside text-gray-600 mb-4">
                <li>A wide variety of icons to suit different needs and styles.</li>
                <li>Responsive and easily scalable for use in different contexts.</li>
                <li>Consistent design language that aligns with Tailwind's principles.</li>
            </ul>
            <p className="text-blue-600 underline"><a href="https://heroicons.com" target="_blank">Visit Heroicons</a></p>
        </section>
        <footer className="mt-8 text-center">
            <p className="text-gray-500">&copy; 2023 Tailwind Genie. All rights reserved. Explore our resources for a better development experience!</p>
        </footer>
    </div>
    </>
    );}