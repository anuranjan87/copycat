import React from "react";
import { ArrowRightIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/header2";
import Head from "next/head";

// Define the Step interface
interface Step {
  name: string;
  description: string;
}

// Define props for CareerSteps
interface CareerStepsProps {
  steps: Step[];
}

// CareerSteps component
const CareerSteps: React.FC<CareerStepsProps> = ({ steps }) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
      {steps.map((step, index) => (
        <React.Fragment key={step.name}>
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg mb-2">
              {index + 1}
            </div>
            <h3 className="font-semibold mb-1">{step.name}</h3>
            <p className="text-sm text-muted-foreground">{step.description}</p>
          </div>
          {index < steps.length - 1 && (
            <ArrowRightIcon className="hidden md:block text-muted-foreground" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

// Main component
export default function UXDesignCareerGuide() {
  const careerSteps: Step[] = [
    { name: "Build Skills", description: "Learn design principles, tools, and methodologies." },
    { name: "Create Portfolio", description: "Showcase your best work and process." },
    { name: "Network", description: "Connect with industry professionals." },
    { name: "Apply for Jobs", description: "Tailor applications for entry-level positions." },
    { name: "Prepare for Interviews", description: "Practice discussing your work and solving design problems." },
    { name: "Continuous Learning", description: "Stay updated on industry trends and new tools." },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl mt-12">
      <Header />
      <Head>
        <title>Starting Your Career as a UI/UX Designer</title>
      </Head>
      <header>
        <h1 className="text-3xl font-bold mb-6">Starting Your Career as a UI/UX Designer: A Guide for Freshers</h1>
      </header>

      <Card className="mb-8">
        <CardContent className="prose dark:prose-invert max-w-none">
          <p className="lead">
            Entering the job market as a UI/UX designer can be both exciting and daunting for fresh graduates or those transitioning into this field. This guide explores the essential steps and considerations for freshers seeking entry-level UI/UX designer positions.
          </p>

          <div className="my-8">
            <CareerSteps steps={careerSteps} />
          </div>

          <h2 className="text-2xl font-semibold mt-6 mb-4">1. Building a Solid Foundation</h2>
          <p>Aspiring UI/UX designers need to acquire a mix of skills and knowledge:</p>
          <ul>
            <li>Design principles and user research methodologies.</li>
            <li>Prototyping tools and usability testing techniques.</li>
            <li>Proficiency in design software (Adobe XD, Sketch, Figma, InVision).</li>
            <li>Basic understanding of front-end development (HTML, CSS, JavaScript).</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-6 mb-4">2. Creating a Strong Portfolio</h2>
          <p>Your portfolio is crucial for showcasing your abilities:</p>
          <ul>
            <li>Include a range of projects (personal, freelance, internships).</li>
            <li>Highlight design challenges, processes, and rationale behind decisions.</li>
            <li>Present case studies with user research, wireframes, and prototypes.</li>
            <li>Demonstrate a user-centered approach and critical thinking skills.</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-6 mb-4">3. Networking in the Design Community</h2>
          <p>Build connections that can lead to opportunities:</p>
          <ul>
            <li>Engage on platforms like LinkedIn, Behance, and Dribbble.</li>
            <li>Attend design meetups, workshops, and webinars.</li>
            <li>Seek mentorship from experienced designers.</li>
            <li>Participate in design forums and online communities.</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-6 mb-4">4. Applying for Entry-Level Positions</h2>
          <p>Tailor your approach when applying for jobs:</p>
          <ul>
            <li>Focus on entry-level positions, internships, or apprenticeships.</li>
            <li>Craft tailored resumes and cover letters for each application.</li>
            <li>Highlight relevant skills and projects.</li>
            <li>Express eagerness to learn and grow within the organization.</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-6 mb-4">5. Preparing for Interviews</h2>
          <p>Be ready to showcase your skills and knowledge:</p>
          <ul>
            <li>Practice discussing your design process and case studies.</li>
            <li>Prepare for scenario-based design problem questions.</li>
            <li>Conduct mock interviews to build confidence.</li>
            <li>Familiarize yourself with industry terminology.</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-6 mb-4">6. Continuous Learning and Adaptation</h2>
          <p>Stay updated in the fast-evolving field of UI/UX design:</p>
          <ul>
            <li>Follow industry blogs, podcasts, and online courses.</li>
            <li>Attend design conferences and workshops.</li>
            <li>Engage in online design communities for ongoing learning.</li>
            <li>Embrace new tools and emerging design techniques.</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-6 mb-4">Conclusion</h2>
          <p>
            Starting a career as a UI/UX designer requires dedication, continuous learning, and a user-centered approach to your own growth. By focusing on building skills, creating a strong portfolio, networking effectively, and preparing thoroughly for job applications and interviews, freshers can position themselves for success in this rewarding field.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
