'use client'
'use client'

import { useState, useTransition } from 'react'
import { uploadImage } from '@/lib/website-actions'

export default function ImageUploadPage() {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  return (
    <div className="p-10 text-white">
      <h1 className="text-xl mb-4">Upload Image</h1>

      <form
        action={(formData) => {
          startTransition(async () => {
            try {
              const url = await uploadImage(formData)
              setImageUrl(url)
            } catch (err) {
              console.error(err)
            }
          })
        }}
      >
        {/* 🔥 YOU FORGOT THIS */}
        <input type="file" name="file" accept="image/*" />

        <button
          type="submit"
          className="ml-4 px-4 py-2 bg-blue-500 rounded"
        >
          {isPending ? 'Uploading...' : 'Upload'}
        </button>
      </form>

      {imageUrl && (
        <div className="mt-6">
          <p>Uploaded Image:</p>
          <img src={imageUrl} className="mt-2 w-64 rounded" />
          <p className="text-sm mt-2 break-all">{imageUrl}</p>
        </div>
      )}
    </div>
  )
}