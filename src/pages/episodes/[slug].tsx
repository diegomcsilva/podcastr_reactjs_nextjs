import { format, parseISO } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Image from 'next/image';
import Link from 'next/link';
import { GetStaticProps, GetStaticPaths } from 'next';
import { api } from '../../services/api';
import { convertDurationToTimeString } from '../../utils/convertDurationToTimeString';

import styles from './episode.module.scss';

type Episode = {
  id: string,
  title: string,
  thumbnail: string,
  members: string,
  publishedAt: string,
  duration: string,
  durationAsString: string,
  url: string,
  description: string,
} 

type EpisodeProps = {
  episode: Episode;
}

export default function Episode({ episode }: EpisodeProps) {
  return (
    <div className={styles.episode}>
      {console.log(episode)}
      <div className={styles.thumbnailContainer}>
        <Link href="/">
          <button type="button">
            <img 
              src="/arrow-left.svg" 
              alt="Voltar"
            />
          </button>
        </Link>
        <Image 
          width={700}
          height={160}
          src={episode.thumbnail}
          objectFit="cover"
        />
        <button>
          <img src="/play.svg" alt="Tocar episódio"/>
        </button>
      </div>

      <header>
        <h1>{episode.title}</h1>
        <span>{episode.members}</span>
        <span>{episode.publishedAt}</span>
        <span>{episode.durationAsString}</span>
      </header>

      <div 
        className={styles.description} 
        dangerouslySetInnerHTML={{__html: episode.description}}
      />
    </div>
  )
}

// Como estamos em um template [slug].tsx que é dinamico temos que passar o getStaticPaths
export const getStaticPaths: GetStaticPaths = async () => {
  const {data} = await api.get('episodes', {
    params: {
      _limit: 2,
      _sort: 'published_at',
      _order: 'desc'
    }
  });

  const paths = data.map(episode => {
    return {
      params: {
        slug: episode.id
      }
    }
  });

  // opções do fallback:
  // false - 404 para os que não forem registrados
  // true - o broswer irá construir a página, construido pelo client (Pegar os dados do useRouter)
  // exemplo:
  // const router - useRouter();
  // if(router.isFallback) {
  //  return <p>Carregando...</p>
  // }
  // 'blocking' a página será gerada pela camada do nextjs irá contr
  // camadas:
  // client (browser) - next.js (node.js) - server (back-end)
  return {
    paths,
    fallback: 'blocking' 
  }
}

// Utilizado para gerar páginas estáticas
export const getStaticProps: GetStaticProps = async (ctx) => {
  const { slug } = ctx.params;

  const { data } = await api.get(`/episodes/${slug}`)

  const episode = {
    id: data.id,
    title: data.title,
    thumbnail: data.thumbnail,
    members: data.members,
    publishedAt: format(parseISO(data.published_at), 'd MMM yy', {
      locale: ptBR
    }),
    duration: Number(data.file.duration),
    durationAsString: convertDurationToTimeString(Number(data.file.duration)),
    description: data.description,
    url: data.file.url,
  }
  return {
    props: {
      episode,
    },
    revalidate: 60 * 60 * 24, // 24 hours
  }
}