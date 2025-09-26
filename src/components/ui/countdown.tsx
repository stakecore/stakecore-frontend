'use client'
import { FC, useEffect, useState } from 'react'

function pad(value: number): string {
  return value.toString().padStart(2, '0')
}

function getRemainingTime(targetDate: Date) {
  const now = new Date().getTime()
  const target = targetDate.getTime()
  const diff = target - now

  if (diff <= 0) {
    return {
      days: '00',
      hours: '00',
      minutes: '00',
      seconds: '00',
    }
  }

  const secondsInMs = 1000
  const minutesInMs = secondsInMs * 60
  const hoursInMs = minutesInMs * 60
  const daysInMs = hoursInMs * 24

  const days = Math.floor(diff / daysInMs)
  const hours = Math.floor((diff % daysInMs) / hoursInMs)
  const minutes = Math.floor((diff % hoursInMs) / minutesInMs)
  const seconds = Math.floor((diff % minutesInMs) / secondsInMs)

  const d = pad(days)
  const h = pad(hours)
  const m = pad(minutes)
  const s = pad(seconds)

  return {
    days: d,
    hours: h,
    minutes: m,
    seconds: s,
  }
}

export interface CircularProgressProps {
  progress: number
  timer: string
  content?: string
  color?: string
}

const CircularProgress: FC<CircularProgressProps> = ({
  progress,
  timer,
  content,
  color = '#fD743d',
}) => {
  return (
    <div
      className="countdown-circle"
      style={{ background: `conic-gradient(#D7D7D7 ${progress}%, ${color} 0)` }}
      data-progress={timer}
      data-content={content}
    />
  )
}

const Countdown = ({ launchDate }) => {
  const [remainingTime, setRemainingTime] = useState({
    days: '00',
    hours: '00',
    minutes: '00',
    seconds: '00',
  })

  useEffect(() => {
    const intervalID = setInterval(() => {
      const remaining = getRemainingTime(launchDate)
      setRemainingTime(remaining)
    }, 1000)

    return () => {
      clearInterval(intervalID)
    }
  }, [])

  const { days, hours, minutes, seconds } = remainingTime
  return (
    <section className="my-12">
      <div className="flex-wrap-center">
        <CircularProgress
          progress={100 - (Number(days) / 365) * 100}
          timer={days}
          content="Days"
          color="#6aaa5e"
        />
        <CircularProgress
          progress={100 - (Number(hours) / 12) * 100}
          timer={hours}
          content="Hours"
          color="#e58630"
        />
        <CircularProgress
          progress={100 - (Number(minutes) / 60) * 100}
          timer={minutes}
          content="Minutes"
          color="#d94357"
        />
        <CircularProgress
          progress={100 - (Number(seconds) / 60) * 100}
          timer={seconds}
          content="Seconds"
          color="#555555"
        />
      </div>
    </section>
  )
}

export default Countdown