import { useRef, useEffect } from 'react';

function capitalize(str) {
  if (!str) return '';
  return str[0].toUpperCase() + str.slice(1);
}

export function getSectionListData(items) {
    return items.reduce((sections, { id, name, price, description, image, category }) => {
        const sectionName = capitalize(category);
        const item = { id, name, price, description, image };
        
        const section = sections.find(s => s.name === sectionName);
        if (section) {
            section.data.push(item);
        } else {
            sections.push({ name: sectionName, data: [item] });
        }

        return sections;
    }, []);
}

export function useUpdateEffect(effect, dependencies = []) {
    const isInitialMount = useRef(true);

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
        } else {
            return effect();
        }
    }, dependencies);
}
