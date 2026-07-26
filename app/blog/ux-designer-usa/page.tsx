"use client"

import React from 'react'
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ChevronDown } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import Header from "@/components/header2"

const salaryData = [
  { level: 'Entry-Level', min: 65000, max: 85000 },
  { level: 'Mid-Level', min: 85000, max: 110000 },
  { level: 'Senior', min: 110000, max: 140000 },
]

const locationData = [
  { city: 'San Francisco, CA', min: 120000, max: 160000 },
  { city: 'New York City, NY', min: 110000, max: 150000 },
  { city: 'Seattle, WA', min: 100000, max: 140000 },
  { city: 'Austin, TX', min: 90000, max: 130000 },
  { city: 'Chicago, IL', min: 85000, max: 125000 },
]

const industryData = [
  { industry: 'Technology', min: 120000, max: 150000 },
  { industry: 'Finance', min: 110000, max: 140000 },
  { industry: 'Healthcare', min: 100000, max: 130000 },
  { industry: 'E-commerce', min: 90000, max: 120000 },
  { industry: 'Education', min: 80000, max: 110000 },
]

export default function UXDesignerSalaryGuide() {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <div className="container mx-auto mt-12 p-4"><Header/><header>
      <h1 className="text-3xl font-bold mb-4">User Experience Designer Salary in the USA: 2025 Guide</h1></header>
      
      <p className="mb-4">
        The field of UX design is booming in the United States, with companies recognizing the importance of user-friendly designs. UX designers are in high demand, and their salaries reflect the critical role they play in creating seamless digital experiences. If you're considering a career in UX design or are curious about salary expectations in the USA, this guide breaks down the numbers for 2024.
      </p>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Average UX Designer Salary in the USA</CardTitle>
          <CardDescription>Salary ranges based on experience level</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salaryData}>
              <XAxis dataKey="level" />
              <YAxis />
              <Bar dataKey="min" fill="#8884d8" name="Minimum" />
              <Bar dataKey="max" fill="#82ca9d" name="Maximum" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Tabs defaultValue="experience" className="mb-8">
        <TabsList>
          <TabsTrigger value="experience">Experience Levels</TabsTrigger>
          <TabsTrigger value="location">Top-Paying Locations</TabsTrigger>
          <TabsTrigger value="industry">Industries</TabsTrigger>
        </TabsList>
        <TabsContent value="experience">
          <Card>
            <CardHeader>
              <CardTitle>Salaries by Experience Level</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5">
                <li><strong>Entry-Level UX Designers:</strong> $65,000 - $85,000 per year</li>
                <li><strong>Mid-Level UX Designers:</strong> $85,000 - $110,000 per year</li>
                <li><strong>Senior UX Designers:</strong> $110,000 - $140,000+ per year</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="location">
          <Card>
            <CardHeader>
              <CardTitle>Top-Paying Locations for UX Designers in the USA</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5">
                {locationData.map((location, index) => (
                  <li key={index}><strong>{location.city}:</strong> ${location.min.toLocaleString()} - ${location.max.toLocaleString()} per year</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="industry">
          <Card>
            <CardHeader>
              <CardTitle>Industries Hiring UX Designers</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5">
                {industryData.map((industry, index) => (
                  <li key={index}><strong>{industry.industry}:</strong> ${industry.min.toLocaleString()} - ${industry.max.toLocaleString()} per year</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-8">
        <CollapsibleTrigger asChild>
          <Button variant="outline">
            Factors Affecting UX Designer Salaries {isOpen ? <ChevronDown className="h-4 w-4 rotate-180 transition-all" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4">
          <ul className="list-disc pl-5">
            <li><strong>Location:</strong> Urban centers like San Francisco and New York offer higher salaries due to the cost of living and demand for tech talent.</li>
            <li><strong>Experience:</strong> Designers with specialized skills, certifications, or a proven track record earn more.</li>
            <li><strong>Company Size:</strong> Larger organizations often pay more than startups, although startups may offer equity or bonuses.</li>
            <li><strong>Skills:</strong> Mastery of tools like Figma, Sketch, Adobe XD, and user research methods can boost your earning potential.</li>
          </ul>
        </CollapsibleContent>
      </Collapsible>

      <Card>
        <CardHeader>
          <CardTitle>How to Increase Your Earning Potential</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5">
            <li><strong>Upskill Continuously:</strong> Stay updated with the latest design tools and methodologies.</li>
            <li><strong>Build a Strong Portfolio:</strong> Showcase a variety of projects that highlight your skills.</li>
            <li><strong>Negotiate Strategically:</strong> Research salary trends and leverage them during negotiations.</li>
            <li><strong>Consider Relocation:</strong> Moving to a high-paying city can significantly increase your earnings.</li>
          </ul>
        </CardContent>
      </Card>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Conclusion</h2>
        <p>
          UX design is a lucrative career in the USA, with salaries that reflect the demand for skilled professionals. Whether you're just starting or are a seasoned designer, opportunities abound across industries. By staying updated with trends, continuously improving your skills, and positioning yourself strategically, you can maximize your earning potential in this exciting field.
        </p>
      </div>

      <div className="mt-8 text-sm text-gray-500">
        Keywords for SEO: UX designer salary in USA, user experience salary 2024, UX designer jobs in the USA, career in UX design, high-paying UX designer jobs.
      </div>
    </div>
  )
}

