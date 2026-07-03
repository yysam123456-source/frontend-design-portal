// @ts-nocheck
import Component from '../../vendor/animata/widget/music-stack-interaction'

const previewProps = {
    albums: [
      {
        id: 1,
        title: "The Dark Side of the Moon",
        artist: "Pink Floyd",
        cover: "https://images.unsplash.com/photo-1569424758782-cba94e6165fd",
      },
      {
        id: 2,
        title: "Abbey Road",
        artist: "The Beatles",
        cover: "https://images.unsplash.com/photo-1516410529446-2c777cb7366d",
      },
      {
        id: 3,
        title: "Thriller",
        artist: "Michael Jackson",
        cover: "https://images.unsplash.com/photo-1559406041-c7d2b2e98690",
      },
      {
        id: 4,
        title: "The Wall",
        artist: "Pink Floyd",
        cover: "https://images.unsplash.com/photo-1528822234686-beae35cab346",
      },
    ],
  }

export default function Preview({ compact }: { compact?: boolean }) {
  return (
    <div className={compact ? 'flex h-full w-full items-center justify-center overflow-hidden bg-slate-100' : 'flex min-h-[360px] w-full items-center justify-center overflow-auto bg-slate-100 p-8'}>
      <div style={compact ? { transform: 'scale(0.48)', transformOrigin: 'center' } : undefined}>
        <Component {...previewProps} />
      </div>
    </div>
  )
}
