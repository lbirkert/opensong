export function rearangeArray(array: any[], index: number, newIndex: number): any[] {
    array.splice(newIndex + (newIndex > index ? 1 : 0), 0, array[index]);
    array.splice(index + (newIndex < index ? 1 : 0), 1);
    return array;
}