"use client"
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Header from "@/components/header2"

const salaryData = [
  { level: "Entry-Level", experience: "0-2 Years", salary: "₹3,50,000 - ₹6,00,000", employers: "Startups, mid-sized IT firms, and design agencies", skills: "Wireframing, prototyping, user research" },
  { level: "Mid-Level", experience: "2-5 Years", salary: "₹6,00,000 - ₹12,00,000", employers: "IT giants, multinational corporations, and e-commerce platforms", skills: "Design thinking, usability testing, interaction design" },
  { level: "Senior", experience: "5+ Years", salary: "₹12,00,000 - ₹20,00,000", employers: "Large corporations like Amazon, Flipkart, Microsoft, and fintech startups", skills: "Advanced prototyping, team leadership, UX strategy" },
  { level: "Managers and Leads", experience: "10+ Years", salary: "₹20,00,000 - ₹40,00,000+", employers: "Fortune 500 companies, design consultancy firms, and global IT companies", skills: "UX roadmapping, team management, stakeholder communication" },
];

const locationData = [
  { city: "Bangalore", salary: "₹7,00,000 - ₹15,00,000" },
  { city: "Mumbai", salary: "₹6,00,000 - ₹13,00,000" },
  { city: "Delhi NCR", salary: "₹5,50,000 - ₹12,00,000" },
  { city: "Hyderabad & Chennai", salary: "₹5,00,000 - ₹10,00,000" },
];

const topCompanies = [
  "Google", "Microsoft", "Amazon", "Facebook",
  "Flipkart", "Myntra", "Zomato", "Swiggy",
  "Razorpay", "Paytm", "PhonePe",
  "Deloitte", "Accenture", "TCS"
];

const UXDesignerSalary: React.FC = () => {
  return (
    <div className="space-y-8 p-4 mt-12 "><Header/><header>
      <h1 className="text-3xl font-bold">User Experience (UX) Designer Salary in India: A Comprehensive Guide for 2025</h1></header>
      
      <Card>
        <CardHeader>
          <CardTitle>UX Designer</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Responsible for improving a product's usability, accessibility, and user interaction to ensure customer satisfaction. They work on wireframes, user flows, and prototypes while collaborating with developers, product managers, and stakeholders.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>UX Designer Salary Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Level</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead>Average Salary (per year)</TableHead>
                <TableHead>Top Employers</TableHead>
                <TableHead>Key Skills</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salaryData.map((data, index) => (
                <TableRow key={index}>
                  <TableCell>{data.level}</TableCell>
                  <TableCell>{data.experience}</TableCell>
                  <TableCell>{data.salary}</TableCell>
                  <TableCell>{data.employers}</TableCell>
                  <TableCell>{data.skills}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Factors Affecting UX Designer Salaries in India</CardTitle>
        </CardHeader>
        <CardContent>
          <h3 className="text-lg font-semibold mb-2">Location</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>City</TableHead>
                <TableHead>Salary Range</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locationData.map((data, index) => (
                <TableRow key={index}>
                  <TableCell>{data.city}</TableCell>
                  <TableCell>{data.salary}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <h3 className="text-lg font-semibold mt-4 mb-2">Other Factors</h3>
          <ul className="list-disc pl-5">
            <li>Skills: Specialized skills like usability testing, interaction design, and expertise in tools like Figma, Sketch, and Adobe XD can significantly boost salaries.</li>
            <li>Industry: E-commerce, fintech, and IT companies generally offer higher salaries compared to design agencies and startups.</li>
            <li>Education and Certifications: UX-related certifications from platforms like Coursera, Udemy, or reputed design schools can add value and increase earning potential.</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top Companies Hiring UX Designers in India</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {topCompanies.map((company, index) => (
              <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded">{company}</span>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How to Boost Your UX Designer Salary?</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5">
            <li>Upskill Regularly: Stay updated with the latest design trends and tools.</li>
            <li>Build a Portfolio: Showcase your work to attract high-paying clients and employers.</li>
            <li>Network: Attend design events and join UX communities like Dribbble, Behance, or LinkedIn groups.</li>
            <li>Freelance: Freelancing on platforms like Upwork and Fiverr can help you gain experience and additional income.</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>FAQs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">What is the starting salary for a UX designer in India?</h3>
              <p>The starting salary ranges from ₹3,50,000 to ₹6,00,000 annually.</p>
            </div>
            <div>
              <h3 className="font-semibold">Which city offers the highest UX designer salaries in India?</h3>
              <p>Bangalore offers the highest salaries, ranging between ₹7,00,000 and ₹15,00,000.</p>
            </div>
            <div>
              <h3 className="font-semibold">Are certifications necessary for a UX design career?</h3>
              <p>While not mandatory, certifications can significantly improve your prospects.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UXDesignerSalary;

