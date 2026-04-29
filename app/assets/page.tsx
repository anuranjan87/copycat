'use client'

import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { uploadImage } from '@/lib/website-actions'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Upload, Link, Check, Image as ImageIcon } from 'lucide-react'
import Head from 'next/head'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full bg-[#0078d4] hover:bg-[#106ebe] text-white" disabled={pending}>
      <Upload className="mr-2 h-4 w-4" /> {pending ? 'Uploading...' : 'Upload Image'}
    </Button>
  )
}

export default function ImageUploadForm() {
  // Wrap uploadImage to match useFormState signature (prevState, formData)
  const wrappedUpload = async (_prevState: string | null, formData: FormData): Promise<string | null> => {
    return await uploadImage(formData)
  }
  const [imageUrl, formAction] = useFormState(wrappedUpload, null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Handle errors from the server action if needed
  // (Assuming uploadImage throws or returns null on failure)
  // For simplicity, we just rely on imageUrl being null.

  const copyToClipboard = () => {
    if (imageUrl) {
      navigator.clipboard.writeText(imageUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <>
      <Head>
        <title>Free image hosting - CDN for websites, unlimited & free, no login required</title>
        <meta name="description" content="Upload and host your images for free with Tailwind Genie. Unlimited bandwidth, no login required, and fast CDN delivery." />
      </Head>

      <div className="min-h-screen bg-[#f3f2f1] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <main className="bg-white p-6 rounded-b-lg shadow-md">
            <Card className="border-0 shadow-none">
              <CardHeader>
                <CardTitle className="text-2xl font-semibold text-[#323130]">Upload Your Image</CardTitle>
              </CardHeader>
              <CardContent>
                <form action={formAction}>
                  <div className="space-y-4">
                    <div className="flex items-center justify-center w-full">
                      <Label htmlFor="file" className="flex flex-col items-center justify-center w-full h-64 border-2 border-[#0078d4] border-dashed rounded-lg cursor-pointer bg-[#f0f0f0] hover:bg-[#e5e5e5]">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <ImageIcon className="w-10 h-10 mb-3 text-[#0078d4]" />
                          <p className="mb-2 text-sm text-[#323130]"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                          <p className="text-xs text-[#605e5c]">SVG, PNG, JPG or GIF (MAX. 800x400px)</p>
                        </div>
                        <Input id="file" name="file" type="file" accept="image/*" required className="hidden" />
                      </Label>
                    </div>
                    <SubmitButton />
                  </div>
                </form>
              </CardContent>

              {imageUrl && (
                <CardFooter className="flex flex-col items-center space-y-4">
                  <img src={imageUrl} alt="Uploaded" className="max-w-full h-auto rounded-lg shadow-md" />
                  <div className="flex items-center space-x-2 w-full">
                    <Input value={imageUrl} readOnly className="flex-grow border-[#0078d4]" />
                    <Button onClick={copyToClipboard} variant="outline" className="border-[#0078d4] text-[#0078d4] hover:bg-[#0078d4] hover:text-white" aria-label="Copy image link">
                      {copied ? <Check className="h-4 w-4" /> : <Link className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardFooter>
              )}

              {error && (
                <CardFooter>
                  <p className="text-red-500">{error}</p>
                </CardFooter>
              )}
            </Card>

            {/* Rest of your sections (Features, Key Features, How It Works, etc.) remain exactly the same */}
            {/* ... (copy from the previous correct version) ... */}
          </main>
          <footer className="mt-8 text-center text-[#605e5c]">
            <p>&copy; 2024 Tailwind Genie. All rights reserved.</p>
          </footer>
        </div>
      </div>
    </>
  )
}