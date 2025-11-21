import dynamic from "next/dynamic"

const BoardroomView = dynamic(() => import("./boardroom-view").then((mod) => ({ default: mod.BoardroomView })), {
  loading: () => <div className="p-8 text-center">Loading boardroom...</div>,
  ssr: false,
})
