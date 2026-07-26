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
  { level: 'Младший', min: 70000, max: 120000 },
  { level: 'Мидл', min: 120000, max: 180000 },
  { level: 'Старший', min: 180000, max: 250000 },
]

const locationData = [
  { city: 'Москва', min: 150000, max: 250000 },
  { city: 'Санкт-Петербург', min: 130000, max: 200000 },
  { city: 'Новосибирск', min: 100000, max: 150000 },
  { city: 'Екатеринбург', min: 90000, max: 140000 },
  { city: 'Казань', min: 80000, max: 130000 },
]

const industryData = [
  { industry: 'Технологии и IT', min: 150000, max: 250000 },
  { industry: 'Финансы', min: 130000, max: 200000 },
  { industry: 'Медицина', min: 110000, max: 180000 },
  { industry: 'Электронная коммерция', min: 90000, max: 150000 },
  { industry: 'Образование', min: 80000, max: 130000 },
]

export default function UXDesignerSalaryGuideRussia() {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <div className="container mx-auto mt-12 p-4"><Header/><header>      <h1 className="text-3xl font-bold mb-4">Зарплата UX-дизайнера в России: Гид на 2024 год</h1></header>

      
      <p className="mb-4">
        Сфера UX-дизайна в России активно развивается, и компании все больше осознают важность создания удобного пользовательского опыта. UX-дизайнеры пользуются большим спросом, и их зарплаты соответствуют значимости их роли в создании цифровых продуктов. Если вы задумываетесь о карьере UX-дизайнера в России или хотите узнать о зарплатах в этой области, этот гид для вас.
      </p>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Средняя зарплата UX-дизайнера в России</CardTitle>
          <CardDescription>Диапазоны зарплат в зависимости от уровня опыта</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salaryData}>
              <XAxis dataKey="level" />
              <YAxis />
              <Bar dataKey="min" fill="#8884d8" name="Минимум" />
              <Bar dataKey="max" fill="#82ca9d" name="Максимум" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Tabs defaultValue="experience" className="mb-8">
        <TabsList>
          <TabsTrigger value="experience">Уровни опыта</TabsTrigger>
          <TabsTrigger value="location">Регионы с высокими зарплатами</TabsTrigger>
          <TabsTrigger value="industry">Сферы деятельности</TabsTrigger>
        </TabsList>
        <TabsContent value="experience">
          <Card>
            <CardHeader>
              <CardTitle>Зарплаты в зависимости от опыта</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5">
                <li><strong>Младший UX-дизайнер (Entry-Level):</strong> 70,000 – 120,000 рублей в месяц</li>
                <li><strong>Мидл UX-дизайнер (Mid-Level):</strong> 120,000 – 180,000 рублей в месяц</li>
                <li><strong>Старший UX-дизайнер (Senior-Level):</strong> 180,000 – 250,000+ рублей в месяц</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="location">
          <Card>
            <CardHeader>
              <CardTitle>Регионы с высокими зарплатами UX-дизайнеров в России</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5">
                {locationData.map((location, index) => (
                  <li key={index}><strong>{location.city}:</strong> {location.min.toLocaleString('ru-RU')} – {location.max.toLocaleString('ru-RU')} рублей в месяц</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="industry">
          <Card>
            <CardHeader>
              <CardTitle>Сферы, где востребованы UX-дизайнеры</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5">
                {industryData.map((industry, index) => (
                  <li key={index}><strong>{industry.industry}:</strong> {industry.min.toLocaleString('ru-RU')} – {industry.max.toLocaleString('ru-RU')} рублей в месяц</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-8">
        <CollapsibleTrigger asChild>
          <Button variant="outline">
            Факторы, влияющие на зарплату UX-дизайнера {isOpen ? <ChevronDown className="h-4 w-4 rotate-180 transition-all" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4">
          <ul className="list-disc pl-5">
            <li><strong>Регион:</strong> Крупные города, такие как Москва и Санкт-Петербург, предлагают более высокие зарплаты.</li>
            <li><strong>Опыт:</strong> Специалисты с сертификацией и уникальными навыками ценятся выше.</li>
            <li><strong>Размер компании:</strong> Крупные компании платят больше, но стартапы могут предлагать бонусы и опцион.</li>
            <li><strong>Навыки:</strong> Владение инструментами, такими как Figma, Adobe XD и навыки проведения исследований пользователей, повышает доход.</li>
          </ul>
        </CollapsibleContent>
      </Collapsible>

      <Card>
        <CardHeader>
          <CardTitle>Как увеличить свой доход в UX-дизайне</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5">
            <li><strong>Постоянно обучайтесь:</strong> Осваивайте новые инструменты и методы проектирования.</li>
            <li><strong>Создайте сильное портфолио:</strong> Покажите разнообразие выполненных проектов.</li>
            <li><strong>Переговоры о зарплате:</strong> Изучите рыночные тренды и используйте их в переговорах.</li>
            <li><strong>Переезд:</strong> Рассмотрите возможность ра��оты в регионах с более высокими зарплатами.</li>
          </ul>
        </CardContent>
      </Card>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Заключение</h2>
        <p>
          UX-дизайн в России — перспективная и высокооплачиваемая сфера. Независимо от уровня вашего опыта, рынок предлагает множество возможностей. Постоянное обучение, развитие навыков и грамотный подход к поиску работы помогут вам добиться успеха в этой захватывающей области.
        </p>
      </div>

      <div className="mt-8 text-sm text-gray-500">
        Ключевые слова для SEO: зарплата UX-дизайнера в России, средний доход UX-дизайнера, UX-дизайн в России, вакансии UX-дизайнеров, карьера UX-дизайнера.
      </div>
    </div>
  )
}

