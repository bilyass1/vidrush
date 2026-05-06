'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import Flux2ImageGenerator from '@/components/youtube/Flux2ImageGenerator'
import { ShoppingBag, Image as ImageIcon, Sparkles, Package, Tag, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function EcommercePage() {
  useAuth()

  const [generatedImages, setGeneratedImages] = useState<string[]>([])
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('fashion')
  const [selectedPrompt, setSelectedPrompt] = useState<string>('')

  const handleImageGenerated = (imageUrl: string) => {
    setGeneratedImages(prev => [imageUrl, ...prev])
    setSelectedImage(imageUrl)
  }

  const handlePromptSelect = (prompt: string) => {
    setSelectedPrompt(prompt)
    // Scroll to the generator
    const generator = document.getElementById('flux2-generator')
    if (generator) {
      generator.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const productCategories = [
    { id: 'fashion', label: 'Fashion', icon: '👗', desc: 'Clothing & Accessories' },
    { id: 'electronics', label: 'Electronics', icon: '📱', desc: 'Tech & Gadgets' },
    { id: 'home', label: 'Home & Living', icon: '🏠', desc: 'Furniture & Decor' },
    { id: 'beauty', label: 'Beauty', icon: '💄', desc: 'Cosmetics & Skincare' },
    { id: 'sports', label: 'Sports', icon: '⚽', desc: 'Fitness & Outdoor' },
    { id: 'food', label: 'Food & Beverage', icon: '🍔', desc: 'Culinary Products' },
  ]

  const promptTemplates = [
    {
      category: 'Product Photography',
      prompts: [
        'Professional product photography, white background, studio lighting, high detail, commercial quality',
        'Lifestyle product shot, natural lighting, modern aesthetic, Instagram style',
        'Minimalist product display, clean background, soft shadows, premium look',
      ]
    },
    {
      category: 'Fashion',
      prompts: [
        'Fashion model wearing [product], professional photoshoot, runway style, high fashion',
        'Street style fashion photography, urban background, trendy outfit, editorial quality',
        'E-commerce fashion flat lay, top view, styled with accessories, clean composition',
      ]
    },
    {
      category: 'Food & Beverage',
      prompts: [
        'Food photography, appetizing presentation, natural lighting, restaurant quality',
        'Product packaging shot, modern design, clean background, commercial photography',
        'Ingredient showcase, fresh and vibrant, rustic background, artisanal style',
      ]
    },
  ]

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-900/50 via-pink-900/50 to-cyan-900/50 border border-purple-500/20 p-8 md:p-12 mb-8">
          <div className="absolute top-0 right-0 -m-8 w-72 h-72 bg-purple-600/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-0 left-0 -m-8 w-72 h-72 bg-cyan-500/10 blur-[120px] rounded-full" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-widest">
                <ShoppingBag size={14} />
                E-commerce AI Studio
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                Generate Product Images
              </h1>
              <p className="text-zinc-400 text-lg leading-relaxed">
                Create professional product photography with AI. Perfect for e-commerce listings, marketing materials, and social media.
              </p>
            </div>
            <div className="shrink-0">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-600 via-pink-500 to-cyan-400 flex items-center justify-center shadow-xl shadow-purple-600/20">
                <Package size={40} className="text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Product Categories */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
              <Tag size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Product Categories</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Choose your product category for optimized prompts</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {productCategories.map((cat) => {
              const isSelected = selectedCategory === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all group',
                    isSelected
                      ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/20'
                      : 'border-zinc-800 bg-zinc-950 hover:border-purple-500/50 hover:bg-zinc-800/50'
                  )}
                >
                  <span className="text-3xl">{cat.icon}</span>
                  <div className="text-center">
                    <p className={cn(
                      'text-sm font-bold transition-colors',
                      isSelected ? 'text-purple-400' : 'text-white group-hover:text-purple-400'
                    )}>
                      {cat.label}
                    </p>
                    <p className="text-[10px] text-zinc-600 mt-0.5">{cat.desc}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Prompt Templates */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Prompt Templates</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Pre-made prompts for common e-commerce needs</p>
            </div>
          </div>

          <div className="space-y-6">
            {promptTemplates.map((template) => (
              <div key={template.category}>
                <h3 className="text-sm font-bold text-purple-400 mb-3">{template.category}</h3>
                <div className="grid gap-2">
                  {template.prompts.map((prompt, idx) => {
                    const isSelected = selectedPrompt === prompt
                    return (
                      <button
                        key={idx}
                        onClick={() => handlePromptSelect(prompt)}
                        className={cn(
                          'text-left p-3 rounded-xl border transition-all group',
                          isSelected
                            ? 'bg-purple-500/10 border-purple-500/50'
                            : 'bg-zinc-950 border-zinc-800 hover:border-purple-500/50 hover:bg-zinc-800/50'
                        )}
                      >
                        <p className={cn(
                          'text-sm transition-colors',
                          isSelected ? 'text-white' : 'text-zinc-400 group-hover:text-white'
                        )}>
                          {prompt}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Flux2 Image Generator */}
        <div id="flux2-generator">
          <Flux2ImageGenerator 
            onImageGenerated={handleImageGenerated}
            initialPrompt={selectedPrompt}
          />
        </div>

        {/* Generated Images Gallery */}
        {generatedImages.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 mt-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center">
                <ImageIcon size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Generated Images</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Your AI-generated product images</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {generatedImages.map((imageUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(imageUrl)}
                  className={cn(
                    'relative aspect-square rounded-xl overflow-hidden border-2 transition-all group',
                    selectedImage === imageUrl
                      ? 'border-purple-500 shadow-lg shadow-purple-500/20'
                      : 'border-zinc-800 hover:border-zinc-700'
                  )}
                >
                  <img
                    src={imageUrl}
                    alt={`Generated ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-xs text-white font-bold">Image {idx + 1}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Selected Image Preview */}
        {selectedImage && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 mt-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-600 to-rose-600 flex items-center justify-center">
                  <TrendingUp size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Selected Image</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">Preview and download your selection</p>
                </div>
              </div>
              <a
                href={selectedImage}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-sm transition-all"
              >
                Download
              </a>
            </div>

            <div className="relative w-full max-w-2xl mx-auto rounded-xl overflow-hidden border border-zinc-700">
              <img
                src={selectedImage}
                alt="Selected"
                className="w-full h-auto"
              />
            </div>
          </div>
        )}

        {/* Tips Section */}
        <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/20 rounded-3xl p-8 mt-8">
          <h3 className="text-lg font-bold text-white mb-4">💡 Tips for Better Product Images</h3>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li className="flex items-start gap-2">
              <span className="text-purple-400 mt-0.5">•</span>
              <span>Use specific product descriptions with materials, colors, and style</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400 mt-0.5">•</span>
              <span>Mention lighting style: "studio lighting", "natural light", "soft shadows"</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400 mt-0.5">•</span>
              <span>Specify background: "white background", "lifestyle setting", "minimal backdrop"</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400 mt-0.5">•</span>
              <span>Add quality keywords: "professional", "high detail", "commercial quality", "8k"</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400 mt-0.5">•</span>
              <span>Use reference images for consistent style across your product line</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
