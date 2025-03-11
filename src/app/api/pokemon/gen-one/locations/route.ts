import { NextResponse } from 'next/server'
import locations from '../data/locations.json'

interface Location {
    title: string
    x?: number
    y?: number
    locType?: string
    img?: string
    width?: number
    height?: number
    desc?: string
    persons?: string[]
    places?: string[]
    slogan?: string
    meta?: {
        title?: string
        x?: number
        y?: number
        locType?: string
        img?: string
        width?: number
        height?: number
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const gameId = searchParams.get('gameId')
    const locationId = searchParams.get('locationId')

    if (!gameId || !locationId) {
        return NextResponse.json(
            { error: 'gameId and locationId are required parameters' },
            { status: 400 }
        )
    }

    // For now, only support game ID 001 (True Blue)
    if (gameId !== '001') {
        return NextResponse.json(
            { error: 'Invalid or unsupported gameId' },
            { status: 400 }
        )
    }

    // Find the requested location
    const location = locations[locationId as keyof typeof locations]

    if (!location) {
        return NextResponse.json(
            { error: 'Location not found' },
            { status: 404 }
        )
    }

    return NextResponse.json(location)
}
