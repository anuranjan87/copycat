"use client"

import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, Image as ImageIcon, ZoomIn, ZoomOut } from 'lucide-react'

export default function Component() {
  const [image, setImage] = useState<string | null>(null)
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [saturation, setSaturation] = useState(100)
  const [hue, setHue] = useState(0)
  const [blur, setBlur] = useState(0)
  const [sepia, setSepia] = useState(0)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [crop, setCrop] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const [isCropping, setIsCropping] = useState(false)
  const [fileFormat, setFileFormat] = useState<string>('png')
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const cropStartRef = useRef<{ x: number; y: number } | null>(null)
  const panStartRef = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (image && canvasRef.current) {
      const img = new Image()
      img.onload = () => {
        setSize({ width: img.width, height: img.height })
        setCrop({ x: 0, y: 0, width: img.width, height: img.height })
        applyChanges()
      }
      img.src = image
    }
  }, [image])

  useEffect(() => {
    applyChanges()
  }, [brightness, contrast, saturation, hue, blur, sepia, crop, size, zoom, pan])

  const applyChanges = () => {
    if (canvasRef.current && image) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      const img = new Image()
      img.onload = () => {
        canvas.width = size.width
        canvas.height = size.height
        ctx!.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) hue-rotate(${hue}deg) blur(${blur}px) sepia(${sepia}%)`
        ctx!.save()
        ctx!.translate(pan.x, pan.y)
        ctx!.scale(zoom, zoom)
        ctx!.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, size.width, size.height)
        ctx!.restore()
      }
      img.src = image
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => setImage(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleDownload = () => {
    if (canvasRef.current) {
      const link = document.createElement('a')
      link.download = `edited-image.${fileFormat}`
      link.href = canvasRef.current.toDataURL(`image/${fileFormat}`)
      link.click()
    }
  }

  const handleReset = () => {
    setBrightness(100)
    setContrast(100)
    setSaturation(100)
    setHue(0)
    setBlur(0)
    setSepia(0)
    setZoom(1)
    setPan({ x: 0, y: 0 })
    if (imageRef.current) {
      setSize({ width: imageRef.current.naturalWidth, height: imageRef.current.naturalHeight })
      setCrop({ x: 0, y: 0, width: imageRef.current.naturalWidth, height: imageRef.current.naturalHeight })
    }
  }

  const handleCrop = () => {
    setIsCropping(!isCropping)
    if (!isCropping) {
      setCrop({ x: 0, y: 0, width: size.width, height: size.height })
    }
  }

  const handleSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSize(prev => ({ ...prev, [name]: parseInt(value) }))
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isCropping) {
      const canvas = canvasRef.current
      const rect = canvas!.getBoundingClientRect()
      const x = (e.clientX - rect.left) / zoom - pan.x
      const y = (e.clientY - rect.top) / zoom - pan.y
      cropStartRef.current = { x, y }
    } else {
      panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isCropping && cropStartRef.current) {
      const canvas = canvasRef.current
      const rect = canvas!.getBoundingClientRect()
      const x = (e.clientX - rect.left) / zoom - pan.x
      const y = (e.clientY - rect.top) / zoom - pan.y
      const width = x - cropStartRef.current.x
      const height = y - cropStartRef.current.y
      setCrop({
        x: cropStartRef.current.x,
        y: cropStartRef.current.y,
        width: Math.abs(width),
        height: Math.abs(height)
      })
    } else if (panStartRef.current) {
      setPan({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y
      })
    }
  }

  const handleMouseUp = () => {
    cropStartRef.current = null
    panStartRef.current = null
  }

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setZoom(prevZoom => Math.min(Math.max(prevZoom * delta, 0.1), 10))
  }

  const handleZoomIn = () => {
    setZoom(prevZoom => Math.min(prevZoom * 1.1, 10))
  }

  const handleZoomOut = () => {
    setZoom(prevZoom => Math.max(prevZoom * 0.9, 0.1))
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left Sidebar */}
      <div className="w-64 bg-gray-800 text-white p-4">
        <h2 className="text-xl font-bold mb-4">Edit Options</h2>
        <ScrollArea className="h-[calc(100vh-8rem)]">
          <div className="space-y-6">
            <div>
              <Label htmlFor="brightness" className="text-sm">Brightness</Label>
              <Slider
                id="brightness"
                min={0}
                max={200}
                step={1}
                value={[brightness]}
                onValueChange={(value) => setBrightness(value[0])}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="contrast" className="text-sm">Contrast</Label>
              <Slider
                id="contrast"
                min={0}
                max={200}
                step={1}
                value={[contrast]}
                onValueChange={(value) => setContrast(value[0])}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="saturation" className="text-sm">Saturation</Label>
              <Slider
                id="saturation"
                min={0}
                max={200}
                step={1}
                value={[saturation]}
                onValueChange={(value) => setSaturation(value[0])}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="hue" className="text-sm">Hue</Label>
              <Slider
                id="hue"
                min={0}
                max={360}
                step={1}
                value={[hue]}
                onValueChange={(value) => setHue(value[0])}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="blur" className="text-sm">Blur</Label>
              <Slider
                id="blur"
                min={0}
                max={20}
                step={0.1}
                value={[blur]}
                onValueChange={(value) => setBlur(value[0])}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="sepia" className="text-sm">Sepia</Label>
              <Slider
                id="sepia"
                min={0}
                max={100}
                step={1}
                value={[sepia]}
                onValueChange={(value) => setSepia(value[0])}
                className="mt-2"
              />
            </div>
            <div>
              <Label className="text-sm">Resize</Label>
              <div className="flex space-x-2 mt-2">
                <Input
                  type="number"
                  name="width"
                  value={size.width}
                  onChange={handleSizeChange}
                  className="w-20 text-black"
                />
                <span className="text-xl">×</span>
                <Input
                  type="number"
                  name="height"
                  value={size.height}
                  onChange={handleSizeChange}
                  className="w-20 text-black"
                />
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white p-4 mb-4 rounded-lg shadow flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
            />
            <Label htmlFor="image-upload" className="cursor-pointer">
              <div className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">
                <Upload size={20} />
                <span>Upload Image</span>
              </div>
            </Label>
            <Button onClick={handleReset} variant="outline">Reset Adjustments</Button>
            <Button onClick={handleCrop} variant="outline">
              {isCropping ? 'Apply Crop' : 'Crop'}
            </Button>
            <Button onClick={handleZoomIn} variant="outline">
              <ZoomIn size={20} />
            </Button>
            <Button onClick={handleZoomOut} variant="outline">
              <ZoomOut size={20} />
            </Button>
            <Select value={fileFormat} onValueChange={setFileFormat}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="png">PNG</SelectItem>
                <SelectItem value="jpeg">JPEG</SelectItem>
                <SelectItem value="webp">WebP</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleDownload} disabled={!image}>Download Edited Image</Button>
        </div>

        {/* Image Area */}
        <div className="flex-1 bg-white p-4 rounded-lg shadow overflow-hidden">
          <div className="w-full h-full flex items-center justify-center">
            {image ? (
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  className="max-w-full max-h-full object-contain cursor-move"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onWheel={handleWheel}
                />
                <img
                  ref={imageRef}
                  src={image}
                  alt="Original"
                  className="hidden"
                />
                {isCropping && (
                  <div
                    className="absolute border-2 border-white pointer-events-none"
                    style={{
                      left: `${crop.x * zoom + pan.x}px`,
                      top: `${crop.y * zoom + pan.y}px`,
                      width: `${crop.width * zoom}px`,
                      height: `${crop.height * zoom}px`,
                    }}
                  />
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <ImageIcon size={64} className="mx-auto mb-4" />
                <p className="text-xl">No image uploaded</p>
                <p className="text-sm">Upload an image to start editing</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}