'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Users, Target, Zap, BarChart3, ArrowUp, ArrowDown, Minus, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

interface Benchmark {
  metric: string
  userValue: number
  industryAvg: number
  topPerformerAvg: number
  gap: number
  recommendation: string
}

interface Pattern {
  id: string
  name: string
  description: string
  platform: string
  format: string
  performanceScore: number
}

interface TopPerformer {
  handle: string
  name: string
  platform: string
  industry: string
}

export default function IntelligencePage() {
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([])
  const [patterns, setPatterns] = useState<Pattern[]>([])
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([])
  const [overallScore, setOverallScore] = useState(0)
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [trending, setTrending] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchIntelligence()
  }, [])

  async function fetchIntelligence() {
    setLoading(true)
    try {
      const [overviewRes, benchmarksRes, trendingRes] = await Promise.all([
        fetch('/api/intelligence?action=overview'),
        fetch('/api/intelligence?action=benchmarks'),
        fetch('/api/intelligence?action=trending'),
      ])
      
      const overview = await overviewRes.json()
      const benchmarksData = await benchmarksRes.json()
      const trendingData = await trendingRes.json()
      
      setPatterns(overview.topPatterns || [])
      setTopPerformers(overview.topPerformers || [])
      setRecommendations(overview.recommendations || [])
      setBenchmarks(benchmarksData.benchmarks || [])
      setOverallScore(benchmarksData.overallScore || 0)
      setTrending(trendingData)
    } catch (e) {
      console.error('Failed to fetch intelligence:', e)
    }
    setLoading(false)
  }

  function getScoreColor(score: number): string {
    if (score >= 75) return 'text-green-600'
    if (score >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  function getBenchmarkIcon(benchmark: Benchmark) {
    if (benchmark.userValue >= benchmark.topPerformerAvg) {
      return <ArrowUp className="w-4 h-4 text-green-500" />
    } else if (benchmark.userValue >= benchmark.industryAvg) {
      return <Minus className="w-4 h-4 text-yellow-500" />
    }
    return <ArrowDown className="w-4 h-4 text-red-500" />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Competitor Intelligence</h1>
        <p className="text-gray-500 text-sm mt-1">
          Learn from top performers. See what works. Apply it automatically.
        </p>
      </div>

      {/* Overall Score */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Your Performance Score</p>
              <p className={`text-4xl font-bold ${getScoreColor(overallScore)}`}>
                {overallScore}
              </p>
              <p className="text-sm text-gray-500 mt-1">vs. industry benchmarks</p>
            </div>
            <div className="w-48">
              <Progress value={overallScore} className="h-3" />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Beginner</span>
                <span>Top 10%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Benchmarks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Your Benchmarks
            </CardTitle>
            <CardDescription>How you compare to top performers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {benchmarks.map((b, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{b.metric}</span>
                  <div className="flex items-center gap-2">
                    {getBenchmarkIcon(b)}
                    <span className="text-sm font-bold">{b.userValue}</span>
                    <span className="text-xs text-gray-400">
                      (avg: {b.industryAvg} | top: {b.topPerformerAvg})
                    </span>
                  </div>
                </div>
                <Progress 
                  value={(b.userValue / b.topPerformerAvg) * 100} 
                  className="h-2"
                />
                <p className="text-xs text-gray-500">{b.recommendation}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Priority Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Priority Actions
            </CardTitle>
            <CardDescription>What to do next based on data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendations.map((rec, i) => (
              <div 
                key={i} 
                className={`p-3 rounded-lg border ${
                  rec.priority === 'high' 
                    ? 'border-red-200 bg-red-50' 
                    : 'border-yellow-200 bg-yellow-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm">{rec.title}</p>
                    <p className="text-xs text-gray-600 mt-1">{rec.description}</p>
                  </div>
                  <Badge variant={rec.priority === 'high' ? 'destructive' : 'secondary'}>
                    {rec.priority}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Proven Patterns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Proven Content Patterns
          </CardTitle>
          <CardDescription>
            Formats that work for top performers in your industry
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {patterns.map((pattern) => (
              <div 
                key={pattern.id}
                className="p-4 border rounded-lg hover:border-green-500 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline">{pattern.platform}</Badge>
                  <span className="text-sm font-bold text-green-600">
                    {pattern.performanceScore}% effective
                  </span>
                </div>
                <h3 className="font-medium">{pattern.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{pattern.description}</p>
                <Badge className="mt-2" variant="secondary">{pattern.format}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Trending Now */}
      {trending && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Trending Now
            </CardTitle>
            <CardDescription>What's working this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {trending.trending?.map((trend: any, i: number) => (
                <div key={i} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{trend.format.replace(/_/g, ' ')}</span>
                    <Badge className="bg-green-100 text-green-800">
                      {trend.engagement_boost}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">{trend.description}</p>
                  <div className="mt-3">
                    <p className="text-xs text-gray-400 mb-1">Example hooks:</p>
                    <div className="space-y-1">
                      {trend.example_hooks?.slice(0, 2).map((hook: string, j: number) => (
                        <p key={j} className="text-xs text-gray-600 italic">"{hook}"</p>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Performers to Study */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Top Performers to Study
          </CardTitle>
          <CardDescription>Learn from the best in your industry</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {topPerformers.map((performer, i) => (
              <a
                key={i}
                href={`https://${performer.platform}.com/${performer.handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-sm">{performer.name || performer.handle}</p>
                  <p className="text-xs text-gray-500">@{performer.handle}</p>
                  <Badge variant="outline" className="mt-1 text-xs">
                    {performer.platform}
                  </Badge>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
