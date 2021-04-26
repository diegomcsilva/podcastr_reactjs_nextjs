import { useContext } from 'react';
import { GetStaticProps } from 'next';
// Auxilia no controle de limitação de tamanho de imagem
import Image from 'next/image';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { api } from '../services/api';
import { convertDurationToTimeString } from '../utils/convertDurationToTimeString';
import { PlayerContext } from '../contexts/PlayerContext';

import styles from './home.module.scss';
// SPA
// SSR
// SSG

// import { useEffect } from "react";

type Episode = {
  id: string,
  title: string,
  thumbnail: string,
  members: string,
  publishedAt: string,
  duration: string,
  durationAsString: string,
  url: string,
  // ...
} 

type HomeProps = {
  latestEpisodes: Episode[];
  allEpisodes: Episode[];
}


export default function Home({latestEpisodes, allEpisodes}: HomeProps) {
  // SPA - Aqui o html não é renderizado e então temos um problema de SEO, por exemplo.
  // useEffect(() => {
  //   fetch('http://localhost:3333/episodes')
  //   .then((response) => response.json)
  //   .then(data => console.log(data));
  // }, [])
  const {play} = useContext(PlayerContext);

  return (
    <div className={styles.homepage}>
      <section className={styles.latestEpisodes}>
        <h2>Últimos lançamentos</h2>

        <ul>
          {latestEpisodes.map(episode => {
            return (
              <li key={episode.id}>
                <Image 
                  width={192} 
                  height={192} 
                  src={episode.thumbnail} 
                  alt={episode.title}
                  objectFit="cover"
                />

                <div className={styles.episodeDetails}>
                  <Link href={`/episodes/${episode.id}`}>
                    <a>{episode.title}</a>
                  </Link>
                  <p>{episode.members}</p>
                  <span>{episode.publishedAt}</span>
                  <span>{episode.durationAsString}</span>
                </div>

                <button type="button" onClick={() => play(episode)}>
                  <img src="/play-green.svg" alt="Tocar episódio"/>
                </button>
              </li>
            )
          })}
        </ul>
      </section>
      <section className={styles.allEpisodes}>
        <h2>Todos episódios</h2>

        <table cellSpacing={0}>
          <thead>
            <tr>
              <th></th>
              <th>Podcast</th>
              <th>Integrantes</th>
              <th>Data</th>
              <th>Duração</th>
            </tr>
          </thead>
          <tbody>
            {
              allEpisodes.map(episode => {
                return (
                  <tr key={episode.id}>
                    <td style={{ width: 72 }} >
                      <Image
                        width={120}
                        height={120}
                        src={episode.thumbnail}
                        alt={episode.title}
                        objectFit="cover"
                      />
                    </td>
                    <td>
                      <Link href={`/episodes/${episode.id}`}>
                        <a>{episode.title}</a>
                      </Link>
                    </td>
                    <td>{episode.members}</td>
                    <td style={{ width: 100 }}>{episode.publishedAt}</td>
                    <td>{episode.durationAsString}</td>
                    <td>
                      <button type="button">
                        <img src="/play-green.svg" alt="Tocar episódio"/>
                      </button>
                    </td>
                  </tr>
                )
              })
            }
          </tbody>
        </table>
      </section>
    </div>
  )
}

// SSR - Aqui a página é renderizada com os dados toda vez que ela é acessada.
// export async function getServerSideProps(){
//   const response = await fetch('http://localhost:3333/episodes')
//   const data = response.json()

//   return {
//     props: {
//       episodes: data,
//     }
//   }
// }

// SSG - Aqui é gerada uma página estática sem a necessidade de ficar fazendo requisições em todos os acessos
// tornando a página mais leve e veloz
export const getStaticProps: GetStaticProps = async () => {
  const {data} = await api.get('episodes', {
    params: {
      _limit: 12,
      _sort: 'published_at',
      _order: 'desc'
    }
  });

  const episodes = data.map(episode => {
    return {
      id: episode.id,
      title: episode.title,
      thumbnail: episode.thumbnail,
      members: episode.members,
      publishedAt: format(parseISO(episode.published_at), 'd MMM yy', {
        locale: ptBR
      }),
      duration: Number(episode.file.duration),
      durationAsString: convertDurationToTimeString(Number(episode.file.duration)),
      url: episode.file.url,
    }
  })

  const latestEpisodes = episodes.slice(0, 2);
  const allEpisodes = episodes.slice(2, episodes.length);

  return {
    props: {
      latestEpisodes,
      allEpisodes
    },
    revalidate: 60 * 60 * 8, // de 8 em 8 horas é feita uma chamada pra o servidor para revalidar os dados
  }
}



