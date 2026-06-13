// Notion API ヘルパー
// ブログ記事をNotionから取得します

const NOTION_TOKEN = import.meta.env.NOTION_TOKEN;
const NOTION_BLOG_DB = import.meta.env.NOTION_BLOG_DB;

// ブログ記事一覧を取得（公開中のみ）
export async function getBlogPosts() {
  if (!NOTION_TOKEN || !NOTION_BLOG_DB) {
    console.warn('Notion環境変数が設定されていません');
    return [];
  }

  try {
    const res = await fetch(`https://api.notion.com/v1/databases/${NOTION_BLOG_DB}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filter: {
          // ステータスが「公開中」のものだけ表示
          // Notionの「公開・非公開切り替え」はここで制御しています
          property: 'ステータス',
          status: {
            equals: '公開中'
          }
        },
        sorts: [
          {
            property: '公開日',
            direction: 'descending'
          }
        ]
      })
    });

    if (!res.ok) {
      console.error('Notion APIエラー:', res.status);
      return [];
    }

    const data = await res.json();

    return data.results.map((page) => {
      const props = page.properties;
      return {
        id: page.id,
        title: props['タイトル']?.title?.[0]?.plain_text ?? '無題',
        category: props['カテゴリ']?.select?.name ?? '',
        date: props['公開日']?.date?.start ?? '',
        author: props['執筆者']?.rich_text?.[0]?.plain_text ?? '',
        summary: props['概要']?.rich_text?.[0]?.plain_text ?? '',
        url: `/blog/${page.id}`,
      };
    });
  } catch (e) {
    console.error('Notion取得エラー:', e);
    return [];
  }
}
