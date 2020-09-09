let x: number = 5;
x++;
x--;

function factorial(x: number): number {
  if (x == 1) {
    return 1;
  }

  return x * factorial(x - 1);
}

console.log(factorial(x));