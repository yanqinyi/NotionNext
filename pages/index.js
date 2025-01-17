import BLOG from '@/blog.config'
import { getPostBlocks } from '@/lib/notion'
import { getGlobalNotionData } from '@/lib/notion/getNotionData'
import { useGlobal } from '@/lib/global'
import { generateRss } from '@/lib/rss'
import { generateRobotsTxt } from '@/lib/robots.txt'
import dynamic from 'next/dynamic'
import { Suspense, useEffect, useState } from 'react'
import Loading from '@/components/Loading'

/**
 * 懒加载默认主题
 */
const DefaultLayout = dynamic(() => import(`@/themes/${BLOG.THEME}/LayoutIndex`), { ssr: true })

/**
 * 首页布局
 * @param {*} props
 * @returns
 */
const Index = props => {
  // 动态切换主题
  const { theme } = useGlobal()
  const [Layout, setLayoutIndex] = useState(DefaultLayout)
  useEffect(() => {
    const loadLayout = async () => {
      setLayoutIndex(dynamic(() => import(`@/themes/${theme}/LayoutIndex`)))
    }
    loadLayout()
  }, [theme])

  return <Suspense fallback={<Loading/>}>
    <Layout {...props} />
  </Suspense>
}

/**
 * SSG 获取数据
 * @returns
 */
export async function getStaticProps() {
  const from = 'index'
  const props = await getGlobalNotionData({ from })

  const { siteInfo } = props
  props.posts = props.allPages.filter(page => page.type === 'Post' && page.status === 'Published')

  const meta = {
    title: `${siteInfo?.title} | ${siteInfo?.description}`,
    description: siteInfo?.description,
    image: siteInfo?.pageCover,
    slug: '',
    type: 'website'
  }
  // 处理分页
  if (BLOG.POST_LIST_STYLE === 'scroll') {
    // 滚动列表默认给前端返回所有数据
  } else if (BLOG.POST_LIST_STYLE === 'page') {
    props.posts = props.posts?.slice(0, BLOG.POSTS_PER_PAGE)
  }

  // 预览文章内容
  if (BLOG.POST_LIST_PREVIEW === 'true') {
    for (const i in props.posts) {
      const post = props.posts[i]
      if (post.password && post.password !== '') {
        continue
      }
      post.blockMap = await getPostBlocks(post.id, 'slug', BLOG.POST_PREVIEW_LINES)
    }
  }

}

export default Index
