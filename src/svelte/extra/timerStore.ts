import { readable } from 'svelte/store'

export default function() {
  return readable(null, set => {
    const update = () => set(new Date());
    
    update()
		
    const interval = setInterval(update, 1000 * 60)
		
    return () => clearInterval(interval)
  })
}
