import { NextResponse } from 'next/server'
import moves from '../data/trueBlueMoves.json'

interface Move {
    id: string
    name: string
    type: string
    PP: number
    basepower: number
    accuracy: number
    description: string
    clean_description: string
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const gameId = searchParams.get('gameId')
    const moveId = searchParams.get('moveId')

    // Validate required parameters
    if (!gameId || !moveId) {
        return NextResponse.json(
            { error: 'gameId and moveId are required parameters' },
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

    // Find the requested move
    const move = moves[moveId as keyof typeof moves]

    if (!move) {
        return NextResponse.json(
            { error: 'Move not found' },
            { status: 404 }
        )
    }

    return NextResponse.json(move)
}
