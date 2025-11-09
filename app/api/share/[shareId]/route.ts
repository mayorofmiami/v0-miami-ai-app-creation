export async function GET(request: Request, { params }: { params: { shareId: string } }) {
  try {
    const { shareId } = params

    // Decode share data
    try {
      const decoded = atob(shareId)
      const shareData = JSON.parse(decoded)

      return Response.json({
        query: shareData.query,
        response: shareData.response,
        timestamp: shareData.timestamp,
      })
    } catch (error) {
      return Response.json({ error: "Invalid share link" }, { status: 400 })
    }
  } catch (error) {
    return Response.json({ error: "Failed to load shared search" }, { status: 500 })
  }
}
