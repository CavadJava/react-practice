import java.io.BufferedReader;
import java.io.InputStreamReader;

public class Demo {
    public static void main(String[] args) throws Exception {
        Process process = new ProcessBuilder("./salam").start();

        BufferedReader reader =
                new BufferedReader(
                        new InputStreamReader(process.getInputStream()));

        String line;
        while ((line = reader.readLine()) != null) {
            System.out.println(line);
        }

        process.waitFor();
    }
}